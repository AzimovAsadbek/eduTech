import type { PrismaClient } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { seedCourse, testDb, truncateAll } from "../helpers/db";

let db: PrismaClient;
let leads: typeof import("@/server/modules/leads/service");
let attribution: typeof import("@/server/modules/attribution/service");

const IG_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 390.0.0.20.85 (iPhone15,2; iOS 18_5; uz_UZ; uz; scale=3.00; 1179x2556; 734012345)";
const SAFARI = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const past = () => Date.now() - 10_000;
const DAY = 86_400_000;

beforeAll(async () => {
  db = await testDb();
  leads = await import("@/server/modules/leads/service");
  attribution = await import("@/server/modules/attribution/service");
  await truncateAll(db);
});

beforeEach(async () => {
  await truncateAll(db, ["LeadNote", "Lead", "Visit", "AuditLog", "Course"]);
});

describe("recordVisit", () => {
  it("records one row per session with channel, device and in-app browser, and ignores bots", async () => {
    const touch = { utmSource: "Instagram", utmMedium: "Story", utmCampaign: "Sentabr_Qabul", landingPath: "/kurslar?utm_source=instagram", referrer: "https://l.instagram.com/" };
    expect(await attribution.recordVisit({ sessionId: "sess-ig-000001", touch, locale: "uz" }, { userAgent: IG_UA })).toEqual({ recorded: true });
    expect(await attribution.recordVisit({ sessionId: "sess-ig-000001", touch, locale: "uz" }, { userAgent: IG_UA })).toEqual({ recorded: false });
    expect(await attribution.recordVisit({ sessionId: "sess-bot-00001", touch }, { userAgent: "facebookexternalhit/1.1" })).toEqual({ recorded: false });

    const visits = await db.visit.findMany();
    expect(visits).toHaveLength(1);
    expect(visits[0]).toMatchObject({
      channel: "INSTAGRAM",
      utmSource: "instagram",
      utmMedium: "story",
      utmCampaign: "sentabr_qabul",
      referrerHost: "l.instagram.com",
      landingPath: "/kurslar",
      device: "mobile",
      inApp: "instagram",
      locale: "uz",
    });
  });

  it("classifies an untagged Instagram in-app visit as INSTAGRAM and a plain visit as DIRECT", async () => {
    await attribution.recordVisit({ sessionId: "sess-ig-000002", touch: { landingPath: "/" } }, { userAgent: IG_UA });
    await attribution.recordVisit({ sessionId: "sess-direct-01", touch: { landingPath: "/" } }, { userAgent: SAFARI });
    const byId = Object.fromEntries((await db.visit.findMany()).map((v) => [v.sessionId, v.channel]));
    expect(byId).toEqual({ "sess-ig-000002": "INSTAGRAM", "sess-direct-01": "DIRECT" });
  });
});

describe("lead attribution", () => {
  it("stores the channel, placement, campaign and landing page of an Instagram lead", async () => {
    await seedCourse(db, { slug: "dasturlash" });
    const r = await leads.createPublicLead(
      {
        type: "EDUCATION",
        name: "Ali Valiyev",
        phone: "+998901234567",
        courseSlug: "dasturlash",
        startedAt: past(),
        attribution: {
          sessionId: "sess-ig-000003",
          last: { utmSource: "instagram", utmMedium: "reels", utmCampaign: "IT_Kuz", utmContent: "video_1", landingPath: "/kurslar/dasturlash", at: Date.now() - 60_000 },
          page: "/kurslar/dasturlash",
        },
      },
      { ip: "203.0.113.9", userAgent: IG_UA },
    );
    const lead = await db.lead.findUniqueOrThrow({ where: { id: r.id } });
    expect(lead).toMatchObject({
      channel: "INSTAGRAM",
      utmSource: "instagram",
      utmMedium: "reels",
      utmCampaign: "it_kuz",
      utmContent: "video_1",
      landingPage: "/kurslar/dasturlash",
      sessionId: "sess-ig-000003",
    });
    expect(lead.utm).toMatchObject({ page: "/kurslar/dasturlash", userAgent: IG_UA });
  });

  it("credits a returning visitor to their first non-direct touch within 30 days", async () => {
    const r = await leads.createPublicLead(
      {
        type: "GENERAL",
        name: "Kamola",
        phone: "+998931112233",
        startedAt: past(),
        attribution: {
          first: { utmSource: "instagram", utmMedium: "bio", landingPath: "/", at: Date.now() - 3 * DAY },
          last: { landingPath: "/kontakt", at: Date.now() - 1000 },
        },
      },
      { userAgent: SAFARI },
    );
    const lead = await db.lead.findUniqueOrThrow({ where: { id: r.id } });
    expect(lead.channel).toBe("INSTAGRAM");
    expect(lead.utmMedium).toBe("bio");
    expect(lead.landingPage).toBe("/");
  });

  it("does not credit a first touch older than 30 days", async () => {
    const r = await leads.createPublicLead(
      { type: "GENERAL", name: "Kamola", phone: "+998931112234", startedAt: past(), attribution: { first: { utmSource: "instagram", at: Date.now() - 45 * DAY }, last: { landingPath: "/" } } },
      { userAgent: SAFARI },
    );
    expect((await db.lead.findUniqueOrThrow({ where: { id: r.id } })).channel).toBe("DIRECT");
  });

  it("derives a Meta fbc value from an Instagram-ads fbclid", async () => {
    const at = Date.now() - 5000;
    const r = await leads.createPublicLead(
      { type: "GENERAL", name: "Bobur", phone: "+998901110000", startedAt: past(), attribution: { last: { utmSource: "ig", utmMedium: "paid", fbclid: "PAZXh0bgNhZW0B", at } } },
      { userAgent: IG_UA },
    );
    const lead = await db.lead.findUniqueOrThrow({ where: { id: r.id } });
    expect(lead.channel).toBe("INSTAGRAM");
    expect(lead.utm).toMatchObject({ fbc: `fb.1.${at}.PAZXh0bgNhZW0B` });
  });

  it("filters leads by channel and campaign", async () => {
    const mk = (phone: string, source?: string, campaign?: string) =>
      leads.createPublicLead({ type: "GENERAL", name: "Test", phone, startedAt: past(), attribution: source ? { last: { utmSource: source, utmCampaign: campaign } } : undefined }, { userAgent: SAFARI });
    await mk("+998900000001", "instagram", "kuz");
    await mk("+998900000002", "instagram", "qish");
    await mk("+998900000003", "telegram");
    await mk("+998900000004");
    const base = { page: 1, pageSize: 20, sort: "createdAt" as const, dir: "desc" as const };
    expect((await leads.listLeads({ ...base, channel: "INSTAGRAM" })).total).toBe(2);
    expect((await leads.listLeads({ ...base, channel: "INSTAGRAM", campaign: "KUZ" })).total).toBe(1);
    expect((await leads.listLeads({ ...base, channel: "DIRECT" })).total).toBe(1);
  });

  it("stamps contactedAt the first time a lead leaves NEW, even when CONTACTED is skipped", async () => {
    const r = await leads.createPublicLead({ type: "GENERAL", name: "Test", phone: "+998900000009", startedAt: past() }, {});
    await leads.transitionLeadStatus(r.id, "IN_PROGRESS", {});
    const first = (await db.lead.findUniqueOrThrow({ where: { id: r.id } })).contactedAt;
    expect(first).toBeInstanceOf(Date);
    await leads.transitionLeadStatus(r.id, "CONTACTED", {});
    expect((await db.lead.findUniqueOrThrow({ where: { id: r.id } })).contactedAt?.getTime()).toBe(first!.getTime());
  });
});
