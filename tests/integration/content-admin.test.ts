import type { PrismaClient } from "@prisma/client";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { testDb, truncateAll } from "../helpers/db";

let db: PrismaClient;
let admin: typeof import("@/server/modules/content/admin");
let schema: typeof import("@/server/modules/content/schema");
let actorId: string;
let teacherIds: string[];

beforeAll(async () => {
  db = await testDb();
  admin = await import("@/server/modules/content/admin");
  schema = await import("@/server/modules/content/schema");
  await truncateAll(db);
});

beforeEach(async () => {
  await truncateAll(db, ["AuditLog", "CourseTeacher", "Course", "Teacher", "AdminUser", "Faq"]);
  actorId = (await db.adminUser.create({ data: { email: "editor@test.local", name: "Editor", passwordHash: "x", role: "EDITOR" } })).id;
  const t1 = await db.teacher.create({ data: { slug: "t-one", name: "Teacher One", title: "Senior" } });
  const t2 = await db.teacher.create({ data: { slug: "t-two", name: "Teacher Two", title: "Lead" } });
  teacherIds = [t1.id, t2.id];
});

const courseInput = (extra: Record<string, unknown> = {}) =>
  schema.courseSchema.parse({
    slug: "dasturlash",
    title: "Dasturlash",
    roleLabel: "Developer",
    tagline: "Build real products.",
    description: "A course description that is long enough.",
    durationLabel: "6 oy",
    status: "PUBLISHED",
    whoFor: ["Boshlovchilar"],
    curriculum: [{ title: "Kirish", lessons: ["HTML", "CSS"] }],
    ...extra,
  }) as Record<string, unknown>;

type CourseWithTeachers = { id: string; slug: string; title: string; teachers: { teacherId: string; teacher: { id: string; name: string } }[] };

describe("createResource (courses)", () => {
  it("creates the course with CourseTeacher join rows, returns includes and audits CREATE", async () => {
    const item = (await admin.createResource("courses", courseInput({ teacherIds }), actorId)) as CourseWithTeachers;
    expect(item.slug).toBe("dasturlash");
    expect(item.teachers.map((t) => t.teacher.name).sort()).toEqual(["Teacher One", "Teacher Two"]);

    const joins = await db.courseTeacher.findMany({ where: { courseId: item.id } });
    expect(joins.map((j) => j.teacherId).sort()).toEqual([...teacherIds].sort());

    const saved = await db.course.findUniqueOrThrow({ where: { id: item.id } });
    expect(saved.whoFor).toEqual(["Boshlovchilar"]);
    expect(saved.skills).toEqual([]);
    expect(saved.curriculum).toEqual([{ title: "Kirish", lessons: ["HTML", "CSS"] }]);

    const log = await db.auditLog.findFirst({ where: { action: "CREATE", entity: "course", entityId: item.id } });
    expect(log?.userId).toBe(actorId);
  });

  it("creates a course without teachers when teacherIds is omitted", async () => {
    const item = (await admin.createResource("courses", courseInput(), actorId)) as CourseWithTeachers;
    expect(item.teachers).toEqual([]);
  });

  it("maps a duplicate slug (P2002) to a 409 conflict", async () => {
    await admin.createResource("courses", courseInput(), actorId);
    await expect(admin.createResource("courses", courseInput({ title: "Another" }), actorId)).rejects.toMatchObject({ status: 409, code: "conflict" });
    expect(await db.course.count()).toBe(1);
  });
});

describe("updateResource (courses)", () => {
  it("replaces the teacher set and audits the changed fields", async () => {
    const created = (await admin.createResource("courses", courseInput({ teacherIds }), actorId)) as CourseWithTeachers;
    const updated = (await admin.updateResource("courses", created.id, { title: "Dasturlash Pro", teacherIds: [teacherIds[1]] }, actorId)) as CourseWithTeachers;
    expect(updated.title).toBe("Dasturlash Pro");
    expect(updated.teachers.map((t) => t.teacherId)).toEqual([teacherIds[1]]);
    expect(await db.courseTeacher.count({ where: { courseId: created.id } })).toBe(1);

    const log = await db.auditLog.findFirst({ where: { action: "UPDATE", entity: "course", entityId: created.id } });
    expect(log?.meta).toEqual({ fields: ["title", "teacherIds"] });
  });

  it("leaves teachers untouched when teacherIds is not part of the patch", async () => {
    const created = (await admin.createResource("courses", courseInput({ teacherIds }), actorId)) as CourseWithTeachers;
    await admin.updateResource("courses", created.id, { featured: true }, actorId);
    expect(await db.courseTeacher.count({ where: { courseId: created.id } })).toBe(2);
  });

  it("maps unknown ids to 404 and duplicate slugs to 409", async () => {
    await admin.createResource("courses", courseInput(), actorId);
    const other = (await admin.createResource("courses", courseInput({ slug: "other" }), actorId)) as CourseWithTeachers;
    await expect(admin.updateResource("courses", "clxmissing00000000000", { title: "x" }, actorId)).rejects.toMatchObject({ status: 404 });
    await expect(admin.updateResource("courses", other.id, { slug: "dasturlash" }, actorId)).rejects.toMatchObject({ status: 409 });
  });
});

describe("deleteResource (courses)", () => {
  it("deletes the course, cascades join rows and audits DELETE", async () => {
    const created = (await admin.createResource("courses", courseInput({ teacherIds }), actorId)) as CourseWithTeachers;
    await admin.deleteResource("courses", created.id, actorId);
    expect(await db.course.findUnique({ where: { id: created.id } })).toBeNull();
    expect(await db.courseTeacher.count({ where: { courseId: created.id } })).toBe(0);
    expect(await db.teacher.count()).toBe(2);
    expect(await db.auditLog.count({ where: { action: "DELETE", entity: "course", entityId: created.id } })).toBe(1);
  });

  it("maps a missing id to 404", async () => {
    await expect(admin.deleteResource("courses", "clxmissing00000000000", actorId)).rejects.toMatchObject({ status: 404 });
  });
});

describe("listResource / getResource", () => {
  it("filters by status and searches, and getResource includes relations", async () => {
    const a = (await admin.createResource("courses", courseInput({ slug: "a-course", title: "Alpha", teacherIds }), actorId)) as CourseWithTeachers;
    await admin.createResource("courses", courseInput({ slug: "b-course", title: "Beta", status: "DRAFT" }), actorId);

    const published = await admin.listResource("courses", { page: 1, pageSize: 50, status: "PUBLISHED" });
    expect(published.total).toBe(1);
    const search = await admin.listResource("courses", { page: 1, pageSize: 50, q: "bet" });
    expect((search.items as { title: string }[]).map((c) => c.title)).toEqual(["Beta"]);

    const got = (await admin.getResource("courses", a.id)) as CourseWithTeachers;
    expect(got.teachers).toHaveLength(2);
    await expect(admin.getResource("courses", "clxmissing00000000000")).rejects.toMatchObject({ status: 404 });
  });
});
