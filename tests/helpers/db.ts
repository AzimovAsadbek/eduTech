/**
 * Database helpers for integration tests. Always bound to `edutech_test`.
 * Import the app's `db` singleton lazily so DATABASE_URL is already set (see tests/setup/integration.ts).
 */
import type { PrismaClient } from "@prisma/client";
import { TEST_DATABASE_URL } from "./env";

export async function testDb(): Promise<PrismaClient> {
  if (process.env.DATABASE_URL !== TEST_DATABASE_URL) throw new Error("testDb() requires the edutech_test DATABASE_URL");
  const { db } = await import("@/server/db");
  return db;
}

/** Tables in dependency-safe order; TRUNCATE ... CASCADE handles FKs anyway. */
const TABLES = [
  "LeadNote",
  "Lead",
  "AuditLog",
  "Session",
  "AdminUser",
  "CourseTeacher",
  "Testimonial",
  "Result",
  "Faq",
  "MediaProject",
  "GalleryItem",
  "Upload",
  "Course",
  "CourseCategory",
  "Teacher",
  "Service",
  "Branch",
  "SiteSetting",
];

export async function truncateAll(db: PrismaClient, tables: string[] = TABLES) {
  const list = tables.map((t) => `"${t}"`).join(", ");
  await db.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
}

export async function seedCourse(db: PrismaClient, overrides: Partial<{ slug: string; title: string; status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }> = {}) {
  return db.course.create({
    data: {
      slug: overrides.slug ?? "test-course",
      title: overrides.title ?? "Test kursi",
      roleLabel: "Developer",
      tagline: "Build real products.",
      description: "Integration test course description.",
      durationLabel: "6 oy",
      status: overrides.status ?? "PUBLISHED",
    },
  });
}

export async function seedService(db: PrismaClient, overrides: Partial<{ slug: string; title: string }> = {}) {
  return db.service.create({
    data: {
      slug: overrides.slug ?? "test-service",
      title: overrides.title ?? "Test xizmat",
      tagline: "Fast and vertical.",
      description: "Integration test service description.",
      status: "PUBLISHED",
    },
  });
}

export async function seedAdmin(db: PrismaClient, input: { email?: string; password: string; role?: "SUPER_ADMIN" | "ADMIN" | "EDITOR" }) {
  const { hashPassword } = await import("@/server/modules/auth/password");
  return db.adminUser.create({
    data: {
      email: input.email ?? "admin@test.local",
      name: "Test Admin",
      role: input.role ?? "SUPER_ADMIN",
      passwordHash: await hashPassword(input.password),
    },
  });
}
