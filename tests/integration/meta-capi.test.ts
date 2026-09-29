import { createHash } from "node:crypto";
import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { seedCourse, testDb, truncateAll } from "../helpers/db";
import { startTelegramMock, type TelegramMock } from "../helpers/telegram-mock";

// The Telegram mock is a generic JSON recorder; here it stands in for graph.facebook.com.
let meta: TelegramMock;
let db: PrismaClient;
let leads: typeof import("@/server/modules/leads/service");

const sha = (v: string) => createHash("sha256").update(v).digest("hex");
const past = () => Date.now() - 10_000;
const IG_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 390.0.0.20.85";

interface CapiBody {
  data: { event_name: string; event_id: string; action_source: string; user_data: Record<string, unknown>; custom_data: Record<string, string>; event_source_url?: string }[];
  test_event_code?: string;
}

beforeAll(async () => {
  meta = await startTelegramMock();
  // env() is cached on first use, so configure Meta before any server module is imported.
  process.env.META_API_BASE = meta.url;
  process.env.NEXT_PUBLIC_META_PIXEL_ID = "1234567890";
  process.env.META_CAPI_ACCESS_TOKEN = "test-token";
  process.env.META_CAPI_TEST_EVENT_CODE = "TEST123";
  process.env.TELEGRAM_BOT_TOKEN = "";
  db = await testDb();
  leads = await import("@/server/modules/leads/service");
  await truncateAll(db);
});

afterAll(async () => {
  await meta.close();
});

beforeEach(async () => {
  meta.reset();
  await truncateAll(db, ["LeadNote", "Lead", "AuditLog", "Course"]);
});

describe("Meta Conversions API", () => {
  it("sends a Lead event with hashed contact data, click ids and the page URL when a lead is created", async () => {
    await seedCourse(db, { slug: "dasturlash", title: "Dasturlash" });
    const r = await leads.createPublicLead(
      {
        type: "EDUCATION",
        name: "Ali Valiyev",
        phone: "+998 90 123 45 67",
        courseSlug: "dasturlash",
        startedAt: past(),
        attribution: { sessionId: "sess-meta-0001", last: { utmSource: "instagram", utmMedium: "ads" }, page: "/kurslar/dasturlash", fbp: "fb.1.1700.99", fbc: "fb.1.1700.click" },
      },
      { ip: "203.0.113.20", userAgent: IG_UA },
    );
    const req = await meta.waitFor("events");
    expect(req.path).toBe("/v23.0/1234567890/events");
    const body = req.body as CapiBody;
    expect(body.test_event_code).toBe("TEST123");
    expect(body.data).toHaveLength(1);
    const e = body.data[0];
    expect(e).toMatchObject({ event_name: "Lead", event_id: r.id, action_source: "website", event_source_url: "http://localhost:3000/kurslar/dasturlash" });
    expect(e.user_data).toMatchObject({ ph: [sha("998901234567")], client_ip_address: "203.0.113.20", client_user_agent: IG_UA, fbc: "fb.1.1700.click", fbp: "fb.1.1700.99" });
    expect(e.custom_data).toMatchObject({ content_name: "Dasturlash", lead_channel: "INSTAGRAM" });
  });

  it("reports an enrolment when a course lead becomes CONVERTED — once", async () => {
    const r = await leads.createPublicLead(
      { type: "EDUCATION", name: "Kamola", phone: "+998931234567", startedAt: past(), attribution: { last: { utmSource: "instagram" }, fbc: "fb.1.1.x" } },
      { userAgent: IG_UA },
    );
    await meta.waitFor("events");
    meta.reset();
    await leads.transitionLeadStatus(r.id, "CONVERTED", {});
    const req = await meta.waitFor("events");
    const e = (req.body as CapiBody).data[0];
    expect(e).toMatchObject({ event_name: "CompleteRegistration", event_id: `${r.id}:enrolled`, action_source: "system_generated" });
    expect(e.user_data).toMatchObject({ ph: [sha("998931234567")], fbc: "fb.1.1.x", client_user_agent: IG_UA });

    meta.reset();
    await leads.transitionLeadStatus(r.id, "CONVERTED", {});
    await new Promise((res) => setTimeout(res, 300));
    expect(meta.requests).toHaveLength(0);
  });

  it("does not report media-service deals as enrolments", async () => {
    const r = await leads.createPublicLead({ type: "MEDIA", name: "Acme", phone: "+998901119999", startedAt: past() }, {});
    await meta.waitFor("events");
    meta.reset();
    await leads.transitionLeadStatus(r.id, "CONVERTED", {});
    await new Promise((res) => setTimeout(res, 300));
    expect(meta.requests).toHaveLength(0);
  });
});
