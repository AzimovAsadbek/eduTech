import { describe, expect, it } from "vitest";
import { educationLeadSchema, generalLeadSchema, leadFilterSchema, leadUpdateSchema, mediaLeadSchema, publicLeadSchema } from "@/server/modules/leads/schema";

const base = { name: "Ali Valiyev", phone: "+998 90 123 45 67" };

describe("publicLeadSchema (discriminated union)", () => {
  it("accepts a valid EDUCATION lead and trims strings", () => {
    const parsed = publicLeadSchema.parse({ type: "EDUCATION", name: "  Ali  ", phone: " +998901234567 ", courseSlug: "dasturlash", startedAt: "1700000000000" });
    expect(parsed.type).toBe("EDUCATION");
    expect(parsed.name).toBe("Ali");
    expect(parsed.phone).toBe("+998901234567");
    expect(parsed.startedAt).toBe(1700000000000);
    if (parsed.type === "EDUCATION") expect(parsed.courseSlug).toBe("dasturlash");
  });

  it("accepts a valid MEDIA lead with company, budget and empty email", () => {
    const parsed = mediaLeadSchema.parse({ type: "MEDIA", ...base, company: "Acme", budget: "1–3 mln soʻm", serviceSlug: "reels-production", email: "" });
    expect(parsed.company).toBe("Acme");
    expect(parsed.email).toBe("");
  });

  it("accepts a valid GENERAL lead with interest", () => {
    const parsed = generalLeadSchema.parse({ type: "GENERAL", ...base, interest: "Kurslar", email: "a@b.co" });
    expect(parsed.interest).toBe("Kurslar");
  });

  it("routes by the `type` discriminator: MEDIA-only fields are dropped from EDUCATION", () => {
    const parsed = publicLeadSchema.parse({ type: "EDUCATION", ...base, company: "Should be ignored" });
    expect(parsed).not.toHaveProperty("company");
  });

  it("rejects an unknown type", () => {
    const res = publicLeadSchema.safeParse({ type: "OTHER", ...base });
    expect(res.success).toBe(false);
  });

  it("rejects a missing type", () => {
    expect(publicLeadSchema.safeParse({ ...base }).success).toBe(false);
  });

  it("rejects a name shorter than 2 characters", () => {
    const res = educationLeadSchema.safeParse({ type: "EDUCATION", name: "A", phone: base.phone });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.issues[0].path).toEqual(["name"]);
  });

  it("rejects invalid phone values", () => {
    for (const phone of ["123", "abc-def-ghij", "+998 90 123 45 67 ext 12", "9".repeat(25)]) {
      expect(educationLeadSchema.safeParse({ type: "EDUCATION", name: "Ali", phone }).success, phone).toBe(false);
    }
  });

  it("accepts phone with spaces, parentheses and dashes", () => {
    expect(educationLeadSchema.safeParse({ type: "EDUCATION", name: "Ali", phone: "(90) 123-45-67" }).success).toBe(true);
  });

  it("rejects a filled honeypot (website)", () => {
    const res = publicLeadSchema.safeParse({ type: "GENERAL", ...base, website: "http://spam.example" });
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error.issues.some((i) => i.path[0] === "website")).toBe(true);
  });

  it("accepts an empty honeypot", () => {
    expect(publicLeadSchema.safeParse({ type: "GENERAL", ...base, website: "" }).success).toBe(true);
  });

  it("rejects an invalid email on MEDIA", () => {
    expect(mediaLeadSchema.safeParse({ type: "MEDIA", ...base, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects overly long message / utm values", () => {
    expect(mediaLeadSchema.safeParse({ type: "MEDIA", ...base, message: "x".repeat(1501) }).success).toBe(false);
    expect(mediaLeadSchema.safeParse({ type: "MEDIA", ...base, utm: { utm_source: "x".repeat(201) } }).success).toBe(false);
    expect(mediaLeadSchema.safeParse({ type: "MEDIA", ...base, utm: { utm_source: "google" } }).success).toBe(true);
  });
});

describe("leadFilterSchema", () => {
  it("applies defaults", () => {
    const f = leadFilterSchema.parse({});
    expect(f).toMatchObject({ page: 1, pageSize: 20, sort: "createdAt", dir: "desc" });
  });

  it("coerces query-string values", () => {
    const f = leadFilterSchema.parse({ page: "2", pageSize: "50", from: "2026-01-01", type: "MEDIA", status: "NEW" });
    expect(f.page).toBe(2);
    expect(f.pageSize).toBe(50);
    expect(f.from).toBeInstanceOf(Date);
    expect(f.type).toBe("MEDIA");
  });

  it("rejects pageSize above 100 and unknown status", () => {
    expect(leadFilterSchema.safeParse({ pageSize: "101" }).success).toBe(false);
    expect(leadFilterSchema.safeParse({ status: "DONE" }).success).toBe(false);
  });
});

describe("leadUpdateSchema", () => {
  it("allows nullable fields and status", () => {
    const u = leadUpdateSchema.parse({ status: "CONTACTED", assignedToId: null, email: null });
    expect(u.status).toBe("CONTACTED");
    expect(u.assignedToId).toBeNull();
  });
  it("rejects an invalid status", () => {
    expect(leadUpdateSchema.safeParse({ status: "NOPE" }).success).toBe(false);
  });
});
