import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { buildEnrollmentEvent, buildLeadEvent, hashName, hashPhone } from "@/server/modules/meta/events";

const sha = (v: string) => createHash("sha256").update(v).digest("hex");

const lead = {
  id: "clead0000000000000000001",
  type: "EDUCATION" as const,
  channel: "INSTAGRAM" as const,
  name: "  Ali  Valiyev ",
  phone: "+998 90 123-45-67",
  sessionId: "3f2b8c1e-6a9d-4d2f-9a51-0c7e2b1d4a66",
  createdAt: new Date("2026-09-29T10:00:00Z"),
  course: { title: "Dasturlash" },
  service: null,
};

describe("Meta hashing", () => {
  it("normalises phones to digits with country code before hashing", () => {
    expect(hashPhone("+998 90 123-45-67")).toBe(sha("998901234567"));
    expect(hashPhone("123")).toBeNull();
  });

  it("hashes first and last name in lower case without punctuation", () => {
    expect(hashName("Ali Valiyev")).toEqual({ fn: [sha("ali")], ln: [sha("valiyev")] });
    expect(hashName("Kamola")).toEqual({ fn: [sha("kamola")] });
    expect(hashName("Oʻlmas-bek")).toEqual({ fn: [sha("olmasbek")] });
    expect(hashName("   ")).toEqual({});
  });
});

describe("buildLeadEvent", () => {
  it("builds a de-duplicable website Lead event with hashed user data and click ids", () => {
    const e = buildLeadEvent(lead, { ip: "203.0.113.7", userAgent: "UA", pageUrl: "https://edutech.uz/kurslar/dasturlash", fbc: "fb.1.1.abc", fbp: "fb.1.2.3" });
    expect(e).toMatchObject({
      event_name: "Lead",
      event_id: lead.id,
      event_time: Math.floor(lead.createdAt.getTime() / 1000),
      action_source: "website",
      event_source_url: "https://edutech.uz/kurslar/dasturlash",
      custom_data: { content_category: "EDUCATION", lead_channel: "INSTAGRAM", content_name: "Dasturlash" },
    });
    expect(e.user_data).toEqual({
      ph: [sha("998901234567")],
      fn: [sha("ali")],
      ln: [sha("valiyev")],
      country: [sha("uz")],
      external_id: [sha(lead.sessionId)],
      client_ip_address: "203.0.113.7",
      client_user_agent: "UA",
      fbc: "fb.1.1.abc",
      fbp: "fb.1.2.3",
    });
    // raw personal data never leaves the server
    expect(JSON.stringify(e)).not.toContain("Valiyev");
    expect(JSON.stringify(e)).not.toContain("901234567");
  });

  it("omits unknown optional fields instead of sending empty values", () => {
    const e = buildLeadEvent({ ...lead, sessionId: null, course: null }, { ip: "0.0.0.0" });
    expect(e.user_data.client_ip_address).toBeUndefined();
    expect(e.user_data.external_id).toBeUndefined();
    expect(e.user_data.fbc).toBeUndefined();
    expect(e.event_source_url).toBeUndefined();
    expect(e.custom_data).toEqual({ content_category: "EDUCATION", lead_channel: "INSTAGRAM" });
  });
});

describe("buildEnrollmentEvent", () => {
  it("reports an enrolment as a system-generated CompleteRegistration with its own event id", () => {
    const at = new Date("2026-10-02T08:30:00Z");
    const e = buildEnrollmentEvent(lead, { fbc: "fb.1.1.abc" }, at);
    expect(e).toMatchObject({ event_name: "CompleteRegistration", event_id: `${lead.id}:enrolled`, action_source: "system_generated", event_time: Math.floor(at.getTime() / 1000) });
    expect(e.custom_data).toMatchObject({ status: "enrolled", lead_channel: "INSTAGRAM" });
    expect(e.user_data.fbc).toBe("fb.1.1.abc");
  });
});
