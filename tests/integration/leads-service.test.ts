import type { PrismaClient } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { seedCourse, seedService, testDb, truncateAll } from "../helpers/db";

let db: PrismaClient;
let svc: typeof import("@/server/modules/leads/service");

beforeAll(async () => {
  db = await testDb();
  svc = await import("@/server/modules/leads/service");
  await truncateAll(db);
});

beforeEach(async () => {
  await truncateAll(db, ["LeadNote", "Lead", "AuditLog", "Course", "Service", "Branch", "AdminUser", "Session"]);
});

const past = () => Date.now() - 10_000;

describe("createPublicLead", () => {
  it("stores a sanitized EDUCATION lead, normalises the phone and resolves courseSlug → courseId", async () => {
    const course = await seedCourse(db, { slug: "dasturlash", title: "Dasturlash" });
    const result = await svc.createPublicLead(
      {
        type: "EDUCATION",
        name: "<b>Ali</b>   Valiyev<script>alert(1)</script>",
        phone: "90 123 45 67",
        courseSlug: "dasturlash",
        message: "Salom <i>dunyo</i>\n\n  qalay?",
        source: "course:dasturlash",
        utm: { utm_source: "google" },
        startedAt: past(),
      },
      { ip: "203.0.113.7" },
    );
    expect(result).toMatchObject({ type: "EDUCATION" });
    expect(result.id).toMatch(/^c/);

    const lead = await db.lead.findUniqueOrThrow({ where: { id: result.id } });
    expect(lead.name).toBe("Ali Valiyevalert(1)");
    expect(lead.phone).toBe("+998901234567");
    expect(lead.courseId).toBe(course.id);
    expect(lead.serviceId).toBeNull();
    expect(lead.message).toBe("Salom dunyo qalay?");
    expect(lead.source).toBe("course:dasturlash");
    expect(lead.utm).toEqual({ utm_source: "google" });
    expect(lead.ip).toBe("203.0.113.7");
    expect(lead.status).toBe("NEW");
    expect(lead.company).toBeNull();
    expect(lead.interest).toBeNull();
  });

  it("resolves courseId directly and ignores an unknown slug without failing", async () => {
    const course = await seedCourse(db, { slug: "smm" });
    const byId = await svc.createPublicLead({ type: "EDUCATION", name: "Ali Valiyev", phone: "+998901234567", courseId: course.id, startedAt: past() }, {});
    expect((await db.lead.findUniqueOrThrow({ where: { id: byId.id } })).courseId).toBe(course.id);

    const unknown = await svc.createPublicLead({ type: "EDUCATION", name: "Ali Valiyev", phone: "+998901234567", courseSlug: "does-not-exist", startedAt: past() }, {});
    expect((await db.lead.findUniqueOrThrow({ where: { id: unknown.id } })).courseId).toBeNull();
  });

  it("stores a MEDIA lead with serviceSlug → serviceId, company, budget and lower-cased email", async () => {
    const service = await seedService(db, { slug: "reels-production", title: "Reels" });
    const r = await svc.createPublicLead(
      { type: "MEDIA", name: "Bobur", phone: "998901112233", company: "<b>Acme</b>", budget: "1–3 mln soʻm", email: "Bobur@Acme.UZ", serviceSlug: "reels-production", startedAt: past() },
      {},
    );
    const lead = await db.lead.findUniqueOrThrow({ where: { id: r.id } });
    expect(lead.type).toBe("MEDIA");
    expect(lead.serviceId).toBe(service.id);
    expect(lead.company).toBe("Acme");
    expect(lead.budget).toBe("1–3 mln soʻm");
    expect(lead.email).toBe("bobur@acme.uz");
    expect(lead.phone).toBe("+998901112233");
    expect(lead.courseId).toBeNull();
  });

  it("stores a GENERAL lead with interest and without course/service", async () => {
    const r = await svc.createPublicLead({ type: "GENERAL", name: "Kamola", phone: "+998 93 000 00 00", interest: "Hamkorlik", startedAt: past() }, {});
    const lead = await db.lead.findUniqueOrThrow({ where: { id: r.id } });
    expect(lead.interest).toBe("Hamkorlik");
    expect(lead.courseId).toBeNull();
    expect(lead.serviceId).toBeNull();
  });

  it("rejects the honeypot with 400 and stores nothing", async () => {
    await expect(svc.createPublicLead({ type: "GENERAL", name: "Bot", phone: "+998901234567", website: "x" as unknown as string, startedAt: past() }, {})).rejects.toMatchObject({
      status: 400,
      message: "Spam aniqlandi",
    });
    expect(await db.lead.count()).toBe(0);
  });

  it("rejects submissions faster than 2 seconds after render", async () => {
    await expect(svc.createPublicLead({ type: "GENERAL", name: "Fast Bot", phone: "+998901234567", startedAt: Date.now() }, {})).rejects.toMatchObject({ status: 400 });
    expect(await db.lead.count()).toBe(0);
  });
});

describe("listLeads", () => {
  const day = (d: string) => new Date(`${d}T10:00:00Z`);

  beforeEach(async () => {
    const course = await seedCourse(db, { slug: "dasturlash" });
    await db.lead.createMany({
      data: [
        { type: "EDUCATION", status: "NEW", name: "Ali Valiyev", phone: "+998901111111", courseId: course.id, createdAt: day("2026-09-01") },
        { type: "EDUCATION", status: "CONTACTED", name: "Bobur Karimov", phone: "+998902222222", createdAt: day("2026-09-05") },
        { type: "MEDIA", status: "NEW", name: "Kamola", phone: "+998903333333", company: "Acme Studio", email: "k@acme.uz", createdAt: day("2026-09-10") },
        { type: "GENERAL", status: "LOST", name: "Diyor", phone: "+998904444444", createdAt: day("2026-09-15") },
        { type: "MEDIA", status: "CONVERTED", name: "ali lowercase", phone: "+998905555555", createdAt: day("2026-09-20") },
      ],
    });
  });

  const base = { page: 1, pageSize: 20, sort: "createdAt" as const, dir: "desc" as const };

  it("returns everything newest first by default with relations included", async () => {
    const { items, total } = await svc.listLeads(base);
    expect(total).toBe(5);
    expect(items.map((l) => l.name)).toEqual(["ali lowercase", "Diyor", "Kamola", "Bobur Karimov", "Ali Valiyev"]);
    expect(items[4].course).toMatchObject({ slug: "dasturlash" });
  });

  it("filters by type and status", async () => {
    expect((await svc.listLeads({ ...base, type: "MEDIA" })).total).toBe(2);
    expect((await svc.listLeads({ ...base, status: "NEW" })).total).toBe(2);
    expect((await svc.listLeads({ ...base, type: "EDUCATION", status: "CONTACTED" })).items.map((l) => l.name)).toEqual(["Bobur Karimov"]);
  });

  it("filters by courseId", async () => {
    const course = await db.course.findUniqueOrThrow({ where: { slug: "dasturlash" } });
    expect((await svc.listLeads({ ...base, courseId: course.id })).items.map((l) => l.name)).toEqual(["Ali Valiyev"]);
  });

  it("searches name (case-insensitive), phone (ignoring spaces), company and email", async () => {
    expect((await svc.listLeads({ ...base, q: "ali" })).items.map((l) => l.name).sort()).toEqual(["Ali Valiyev", "ali lowercase"]);
    expect((await svc.listLeads({ ...base, q: "90 222 22 22" })).items.map((l) => l.name)).toEqual(["Bobur Karimov"]);
    expect((await svc.listLeads({ ...base, q: "acme" })).items.map((l) => l.name)).toEqual(["Kamola"]);
    expect((await svc.listLeads({ ...base, q: "k@acme" })).items.map((l) => l.name)).toEqual(["Kamola"]);
    expect((await svc.listLeads({ ...base, q: "nobody" })).total).toBe(0);
  });

  it("filters by date range", async () => {
    const { items } = await svc.listLeads({ ...base, from: day("2026-09-04"), to: day("2026-09-16") });
    expect(items.map((l) => l.name)).toEqual(["Diyor", "Kamola", "Bobur Karimov"]);
    expect((await svc.listLeads({ ...base, from: day("2026-09-19") })).items.map((l) => l.name)).toEqual(["ali lowercase"]);
  });

  it("paginates and sorts", async () => {
    const p1 = await svc.listLeads({ ...base, pageSize: 2, sort: "name", dir: "asc" });
    expect(p1.total).toBe(5);
    expect(p1.items).toHaveLength(2);
    const p3 = await svc.listLeads({ ...base, page: 3, pageSize: 2, sort: "name", dir: "asc" });
    expect(p3.items).toHaveLength(1);
    const all = [...p1.items, ...(await svc.listLeads({ ...base, page: 2, pageSize: 2, sort: "name", dir: "asc" })).items, ...p3.items].map((l) => l.name);
    expect(all).toHaveLength(5);
    expect(new Set(all).size).toBe(5);
  });
});

describe("transitionLeadStatus / updateLead", () => {
  it("sets contactedAt on CONTACTED and closedAt on CONVERTED/LOST, clearing it again when reopened", async () => {
    const lead = await db.lead.create({ data: { type: "GENERAL", name: "Ali Valiyev", phone: "+998901234567" } });

    const contacted = await svc.transitionLeadStatus(lead.id, "CONTACTED", { actorId: undefined, actorLabel: "Admin" });
    expect(contacted.status).toBe("CONTACTED");
    expect(contacted.contactedAt).toBeInstanceOf(Date);
    expect(contacted.closedAt).toBeNull();

    const converted = await svc.transitionLeadStatus(lead.id, "CONVERTED", {});
    expect(converted.closedAt).toBeInstanceOf(Date);
    expect(converted.contactedAt).toEqual(contacted.contactedAt);

    const reopened = await svc.transitionLeadStatus(lead.id, "IN_PROGRESS", {});
    expect(reopened.closedAt).toBeNull();

    const lost = await svc.transitionLeadStatus(lead.id, "LOST", { viaTelegram: true, actorLabel: "@tester" });
    expect(lost.closedAt).toBeInstanceOf(Date);
  });

  it("writes an AuditLog STATUS_CHANGE entry with status, channel and actor", async () => {
    const lead = await db.lead.create({ data: { type: "GENERAL", name: "Ali Valiyev", phone: "+998901234567" } });
    await svc.transitionLeadStatus(lead.id, "CONTACTED", { actorLabel: "@tester", viaTelegram: true });
    const logs = await db.auditLog.findMany({ where: { entity: "Lead", entityId: lead.id, action: "STATUS_CHANGE" } });
    expect(logs).toHaveLength(1);
    expect(logs[0].meta).toEqual({ status: "CONTACTED", via: "telegram", actor: "@tester" });
    expect(logs[0].userId).toBeNull();
  });

  it("throws 404 for an unknown lead on update", async () => {
    await expect(svc.updateLead("clxdoesnotexist000000", { status: "CONTACTED" }, { id: "u", name: "U" })).rejects.toMatchObject({ status: 404 });
  });

  it("updateLead records UPDATE and, when status changes, a STATUS_CHANGE attributed to the admin", async () => {
    const actor = await db.adminUser.create({ data: { email: "a@test.local", name: "Ada", passwordHash: "x", role: "ADMIN" } });
    const lead = await db.lead.create({ data: { type: "GENERAL", name: "Ali Valiyev", phone: "+998901234567" } });

    const updated = await svc.updateLead(lead.id, { name: "Ali V.", status: "IN_PROGRESS" }, { id: actor.id, name: actor.name });
    expect(updated.name).toBe("Ali V.");
    expect(updated.status).toBe("IN_PROGRESS");

    const logs = await db.auditLog.findMany({ where: { entityId: lead.id }, orderBy: { createdAt: "asc" } });
    expect(logs.map((l) => l.action)).toEqual(["UPDATE", "STATUS_CHANGE"]);
    expect(logs[0].meta).toEqual({ fields: ["name"] });
    expect(logs[1].userId).toBe(actor.id);
    expect(logs[1].meta).toMatchObject({ status: "IN_PROGRESS", via: "admin", actor: "Ada" });

    // same status again → no extra STATUS_CHANGE
    await svc.updateLead(lead.id, { status: "IN_PROGRESS" }, { id: actor.id, name: actor.name });
    expect(await db.auditLog.count({ where: { entityId: lead.id, action: "STATUS_CHANGE" } })).toBe(1);
  });

  it("addLeadNote strips HTML and deleteLead audits", async () => {
    const actor = await db.adminUser.create({ data: { email: "b@test.local", name: "Bo", passwordHash: "x" } });
    const lead = await db.lead.create({ data: { type: "GENERAL", name: "Ali Valiyev", phone: "+998901234567" } });
    const note = await svc.addLeadNote(lead.id, "<b>call</b> back", actor.id);
    expect(note.text).toBe("call back");
    expect(note.author?.name).toBe("Bo");
    await expect(svc.addLeadNote("clxnope00000000000000", "x", actor.id)).rejects.toMatchObject({ status: 404 });

    await svc.deleteLead(lead.id, actor.id);
    expect(await db.lead.findUnique({ where: { id: lead.id } })).toBeNull();
    expect(await db.leadNote.count({ where: { leadId: lead.id } })).toBe(0);
    expect(await db.auditLog.count({ where: { entityId: lead.id, action: "DELETE" } })).toBe(1);
  });
});
