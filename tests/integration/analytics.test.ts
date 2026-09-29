import type { Channel, LeadStatus, PrismaClient } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { seedAdmin, seedCourse, testDb, truncateAll } from "../helpers/db";
import { cookieJar } from "../helpers/next-headers";

let db: PrismaClient;
let analytics: typeof import("@/server/modules/analytics/service");
let metrics: typeof import("@/server/modules/analytics/metrics");

const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/** Fixed clock: 15 Sep 2026, 12:00 in Tashkent (UTC+5), so windows and day buckets are deterministic. */
const NOW = new Date("2026-09-15T07:00:00.000Z");
const at = (msAgo: number) => new Date(NOW.getTime() - msAgo);
const TODAY = at(HOUR); // 11:00 local, 15 Sep
const TWO_DAYS = at(2 * DAY); // 13 Sep
const TEN_DAYS = at(10 * DAY); // 5 Sep
const FORTY_DAYS = at(40 * DAY); // outside 30, inside 90
/** 30-day window starts at local midnight of 17 Aug = 16 Aug 19:00 UTC. */
const WINDOW_30_START = new Date("2026-08-16T19:00:00.000Z");

let seq = 0;
async function visits(n: number, channel: Channel, createdAt: Date, tags: { utmMedium?: string; utmCampaign?: string } = {}) {
  await db.visit.createMany({
    data: Array.from({ length: n }, () => ({ sessionId: `sess-analytics-${++seq}`, channel, landingPath: "/", device: "mobile", createdAt, ...tags })),
  });
}

async function lead(
  channel: Channel,
  createdAt: Date,
  opts: { status?: LeadStatus; medium?: string; campaign?: string; courseId?: string; respondedAfterMin?: number } = {},
) {
  return db.lead.create({
    data: {
      type: opts.courseId ? "EDUCATION" : "GENERAL",
      name: `Lead ${++seq}`,
      phone: `+99890${String(seq).padStart(7, "0")}`,
      channel,
      utmMedium: opts.medium,
      utmCampaign: opts.campaign,
      courseId: opts.courseId,
      status: opts.status ?? "NEW",
      createdAt,
      contactedAt: opts.respondedAfterMin === undefined ? null : new Date(createdAt.getTime() + opts.respondedAfterMin * MIN),
    },
  });
}

beforeAll(async () => {
  db = await testDb();
  analytics = await import("@/server/modules/analytics/service");
  metrics = await import("@/server/modules/analytics/metrics");
  await truncateAll(db);
});

beforeEach(async () => {
  cookieJar.clear();
  await truncateAll(db, ["LeadNote", "Lead", "Visit", "AuditLog", "Session", "AdminUser", "Course"]);
});

/**
 * 30-day picture (plus rows just outside it):
 *   Instagram  13 visits · 4 leads (3 contacted after 10/30/50 min) · 1 enrolled · 1 lost
 *   Telegram    5 visits · 2 leads (contacted after 60/120 min) · 1 enrolled
 *   Direct      5 visits · 1 lead (never contacted)
 *   Google      0 visits · 1 lead (contacted after 5 min) · 1 enrolled
 */
async function seedFunnel() {
  const courseA = await seedCourse(db, { slug: "dasturlash", title: "Dasturlash" });
  const courseB = await seedCourse(db, { slug: "smm", title: "SMM" });

  await visits(3, "INSTAGRAM", TWO_DAYS, { utmMedium: "story", utmCampaign: "kuz_qabul" });
  await visits(1, "INSTAGRAM", TODAY, { utmMedium: "story" });
  await visits(3, "INSTAGRAM", TODAY, { utmMedium: "bio" });
  await visits(1, "INSTAGRAM", WINDOW_30_START, { utmMedium: "bio" }); // first instant of the window: counted
  await visits(1, "INSTAGRAM", new Date(WINDOW_30_START.getTime() - MIN), { utmMedium: "bio" }); // a minute earlier: not counted
  await visits(2, "INSTAGRAM", TEN_DAYS, { utmMedium: "reels", utmCampaign: "kuz_qabul" });
  await visits(2, "INSTAGRAM", TODAY, { utmMedium: "post", utmCampaign: "yoz_aksiya" });
  await visits(1, "INSTAGRAM", TWO_DAYS); // untagged in-app visit
  await visits(3, "INSTAGRAM", FORTY_DAYS, { utmMedium: "story", utmCampaign: "bahor" });
  await visits(5, "TELEGRAM", TEN_DAYS, { utmCampaign: "yangi_guruh" });
  await visits(5, "DIRECT", TODAY);

  await lead("INSTAGRAM", TWO_DAYS, { medium: "story", campaign: "kuz_qabul", courseId: courseA.id, status: "CONVERTED", respondedAfterMin: 10 });
  await lead("INSTAGRAM", TWO_DAYS, { medium: "story", campaign: "kuz_qabul", courseId: courseA.id, status: "CONTACTED", respondedAfterMin: 30 });
  await lead("INSTAGRAM", TODAY, { medium: "bio", courseId: courseB.id });
  await lead("INSTAGRAM", TEN_DAYS, { medium: "reels", campaign: "kuz_qabul", courseId: courseA.id, status: "LOST", respondedAfterMin: 50 });
  await lead("INSTAGRAM", FORTY_DAYS, { medium: "story", campaign: "bahor", status: "CONVERTED", respondedAfterMin: 15 });
  await lead("INSTAGRAM", new Date("2026-09-15T19:30:00.000Z"), { medium: "story" }); // tomorrow (local): outside the window
  await lead("TELEGRAM", TEN_DAYS, { campaign: "yangi_guruh", status: "CONVERTED", respondedAfterMin: 60 });
  await lead("TELEGRAM", TEN_DAYS, { campaign: "yangi_guruh", status: "IN_PROGRESS", respondedAfterMin: 120 });
  await lead("DIRECT", TODAY);
  await lead("GOOGLE", TWO_DAYS, { status: "CONVERTED", respondedAfterMin: 5 });

  return { courseA, courseB };
}

describe("channelAnalytics", () => {
  it("returns totals and per-channel funnels with lead %, enrol % and median response time", async () => {
    await seedFunnel();
    const r = await analytics.channelAnalytics({ days: 30, now: NOW });

    expect(r.days).toBe(30);
    expect(r.range).toEqual({ from: WINDOW_30_START.toISOString(), to: "2026-09-15T19:00:00.000Z", timeZone: "Asia/Tashkent" });
    // median of 5, 10, 30, 50, 60, 120 → (30 + 50) / 2
    expect(r.totals).toEqual({ visits: 23, leads: 8, contacted: 6, enrolled: 3, leadRate: 34.8, enrollRate: 37.5, medianResponseMinutes: 40 });

    expect(r.byChannel.map((c) => c.channel)).toEqual(["INSTAGRAM", "TELEGRAM", "DIRECT", "GOOGLE"]);
    const by = Object.fromEntries(r.byChannel.map((c) => [c.channel, c]));
    expect(by.INSTAGRAM).toEqual({
      channel: "INSTAGRAM",
      visits: 13,
      leads: 4,
      contacted: 3,
      enrolled: 1,
      lost: 1,
      leadRate: 30.8,
      enrollRate: 25,
      medianResponseMinutes: 30,
    });
    expect(by.TELEGRAM).toMatchObject({ visits: 5, leads: 2, contacted: 2, enrolled: 1, lost: 0, leadRate: 40, enrollRate: 50, medianResponseMinutes: 90 });
    expect(by.DIRECT).toMatchObject({ visits: 5, leads: 1, contacted: 0, enrolled: 0, leadRate: 20, enrollRate: 0, medianResponseMinutes: null });
    // No visits recorded for Google: the lead rate is 0 rather than a division by zero.
    expect(by.GOOGLE).toMatchObject({ visits: 0, leads: 1, contacted: 1, enrolled: 1, leadRate: 0, enrollRate: 100, medianResponseMinutes: 5 });
  });

  it("breaks Instagram down into a funnel, placements (utm_medium), campaigns and courses", async () => {
    const { courseA, courseB } = await seedFunnel();
    const { instagram: ig } = await analytics.channelAnalytics({ days: 30, now: NOW });

    expect(ig.funnel).toEqual({ visits: 13, leads: 4, contacted: 3, enrolled: 1 });
    expect(ig).toMatchObject({ leadRate: 30.8, enrollRate: 25, medianResponseMinutes: 30 });

    expect(ig.placements).toEqual([
      { medium: "story", label: "Stories", visits: 4, leads: 2, enrolled: 1, leadRate: 50, enrollRate: 50 },
      { medium: "bio", label: "Profil havolasi (bio)", visits: 4, leads: 1, enrolled: 0, leadRate: 25, enrollRate: 0 },
      { medium: "reels", label: "Reels", visits: 2, leads: 1, enrolled: 0, leadRate: 50, enrollRate: 0 },
      { medium: "post", label: "Post", visits: 2, leads: 0, enrolled: 0, leadRate: 0, enrollRate: 0 },
      { medium: null, label: "belgilanmagan", visits: 1, leads: 0, enrolled: 0, leadRate: 0, enrollRate: 0 },
    ]);

    expect(ig.campaigns).toEqual([
      { channel: "INSTAGRAM", campaign: "kuz_qabul", visits: 5, leads: 3, enrolled: 1, leadRate: 60, enrollRate: 33.3 },
      { channel: "INSTAGRAM", campaign: "yoz_aksiya", visits: 2, leads: 0, enrolled: 0, leadRate: 0, enrollRate: 0 },
    ]);

    expect(ig.topCourses).toEqual([
      { courseId: courseA.id, title: "Dasturlash", slug: "dasturlash", leads: 3, enrolled: 1, enrollRate: 33.3 },
      { courseId: courseB.id, title: "SMM", slug: "smm", leads: 1, enrolled: 0, enrollRate: 0 },
    ]);
  });

  it("builds a zero-filled daily Instagram series in the business time zone that adds up to the funnel", async () => {
    await seedFunnel();
    const { instagram: ig } = await analytics.channelAnalytics({ days: 30, now: NOW });

    expect(ig.series).toHaveLength(30);
    expect(ig.series[0].day).toBe("2026-08-17");
    expect(ig.series[29].day).toBe("2026-09-15");
    const day = (d: string) => ig.series.find((p) => p.day === d);
    expect(day("2026-09-15")).toEqual({ day: "2026-09-15", visits: 6, leads: 1 });
    expect(day("2026-09-13")).toEqual({ day: "2026-09-13", visits: 4, leads: 2 });
    expect(day("2026-09-05")).toEqual({ day: "2026-09-05", visits: 2, leads: 1 });
    // 16 Aug 19:00 UTC is already 17 Aug in Tashkent.
    expect(day("2026-08-17")).toEqual({ day: "2026-08-17", visits: 1, leads: 0 });
    expect(ig.series.reduce((s, p) => s + p.visits, 0)).toBe(ig.funnel.visits);
    expect(ig.series.reduce((s, p) => s + p.leads, 0)).toBe(ig.funnel.leads);
  });

  it("ranks tagged campaigns across all channels", async () => {
    await seedFunnel();
    const r = await analytics.channelAnalytics({ days: 30, now: NOW });
    expect(r.campaigns.map((c) => [c.channel, c.campaign, c.visits, c.leads, c.enrolled])).toEqual([
      ["INSTAGRAM", "kuz_qabul", 5, 3, 1],
      ["TELEGRAM", "yangi_guruh", 5, 2, 1],
      ["INSTAGRAM", "yoz_aksiya", 2, 0, 0],
    ]);
  });

  it("follows the selected range", async () => {
    await seedFunnel();
    const week = await analytics.channelAnalytics({ days: 7, now: NOW });
    expect(week.totals).toMatchObject({ visits: 15, leads: 5, enrolled: 2 });
    expect(week.instagram.funnel).toEqual({ visits: 10, leads: 3, contacted: 2, enrolled: 1 });
    expect(week.instagram.series).toHaveLength(7);
    // Equal leads: the channel with more visits comes first.
    expect(week.byChannel.map((c) => c.channel)).toEqual(["INSTAGRAM", "DIRECT", "GOOGLE"]);

    const quarter = await analytics.channelAnalytics({ days: 90, now: NOW });
    expect(quarter.instagram.funnel).toEqual({ visits: 17, leads: 5, contacted: 4, enrolled: 2 });
    expect(quarter.instagram.campaigns.map((c) => c.campaign)).toEqual(["kuz_qabul", "bahor", "yoz_aksiya"]);
    expect(quarter.instagram.medianResponseMinutes).toBe(22.5); // 10, 15, 30, 50
  });

  it("keeps only the top 10 Instagram campaigns and the top 20 overall", async () => {
    for (let i = 0; i < 12; i++) await visits(12 - i, "INSTAGRAM", TODAY, { utmMedium: "story", utmCampaign: `ig_${String(i).padStart(2, "0")}` });
    for (let i = 0; i < 12; i++) await visits(1, "TELEGRAM", TODAY, { utmCampaign: `tg_${String(i).padStart(2, "0")}` });
    const r = await analytics.channelAnalytics({ days: 7, now: NOW });
    expect(r.instagram.campaigns).toHaveLength(10);
    expect(r.instagram.campaigns[0].campaign).toBe("ig_00");
    expect(r.campaigns).toHaveLength(20);
    expect(r.campaigns.slice(0, 11).every((c) => c.channel === "INSTAGRAM")).toBe(true);
  });

  it("returns an empty but complete shape when there is no traffic yet", async () => {
    const r = await analytics.channelAnalytics({ days: 7, now: NOW });
    expect(r.totals).toEqual({ visits: 0, leads: 0, contacted: 0, enrolled: 0, leadRate: 0, enrollRate: 0, medianResponseMinutes: null });
    expect(r.byChannel).toEqual([]);
    expect(r.campaigns).toEqual([]);
    expect(r.instagram).toMatchObject({ funnel: { visits: 0, leads: 0, contacted: 0, enrolled: 0 }, placements: [], campaigns: [], topCourses: [], medianResponseMinutes: null });
    expect(r.instagram.series).toEqual(metrics.windowDays(7, NOW).map((d) => ({ day: d, visits: 0, leads: 0 })));
  });
});

describe("GET /api/v1/admin/analytics/channels", () => {
  const PASSWORD = "Correct-Horse-1";
  const call = async (query: string) => {
    const { GET } = await import("@/app/api/v1/admin/analytics/channels/route");
    const res = await GET(new Request(`http://localhost:3000/api/v1/admin/analytics/channels${query}`), { params: Promise.resolve({}) });
    return { status: res.status, body: (await res.json()) as { ok: boolean; data?: { days: number }; error?: { code: string } } };
  };
  const signIn = async (role: "ADMIN" | "EDITOR") => {
    const auth = await import("@/server/modules/auth/service");
    await seedAdmin(db, { email: `${role.toLowerCase()}@test.local`, password: PASSWORD, role });
    await auth.login({ email: `${role.toLowerCase()}@test.local`, password: PASSWORD }, {});
  };

  it("serves admins, defaults to 30 days and validates the range", async () => {
    await signIn("ADMIN");
    expect(await call("?days=7")).toMatchObject({ status: 200, body: { ok: true, data: { days: 7 } } });
    expect(await call("")).toMatchObject({ status: 200, body: { data: { days: 30 } } });
    expect(await call("?days=14")).toMatchObject({ status: 422, body: { ok: false, error: { code: "validation_error" } } });
  });

  it("refuses anonymous visitors and editors", async () => {
    expect((await call("?days=7")).status).toBe(401);
    await signIn("EDITOR");
    expect((await call("?days=7")).status).toBe(403);
  });
});
