import type { z } from "zod";
import { CacheTags, type CacheTag } from "@/server/cache";
import {
  branchSchema,
  courseCategorySchema,
  courseSchema,
  faqSchema,
  galleryItemSchema,
  mediaProjectSchema,
  resultSchema,
  serviceSchema,
  teacherSchema,
  testimonialSchema,
} from "./schema";

/**
 * Describes each CMS resource once: which Prisma model, which Zod contract,
 * which cache tags to invalidate, and which fields are searchable.
 * The generic admin service and API routes are driven by this table.
 */
export interface ResourceDef<S extends z.ZodTypeAny = z.ZodTypeAny> {
  model: "course" | "courseCategory" | "teacher" | "service" | "mediaProject" | "testimonial" | "result" | "galleryItem" | "faq" | "branch";
  label: string;
  schema: S;
  tags: CacheTag[];
  search: string[];
  hasStatus: boolean;
  /** Relations to include on read. */
  include?: Record<string, unknown>;
  defaultOrder: Record<string, "asc" | "desc">[];
}

export const resources = {
  courses: {
    model: "course",
    label: "Kurslar",
    schema: courseSchema,
    tags: [CacheTags.courses, CacheTags.faq],
    search: ["title", "slug", "roleLabel"],
    hasStatus: true,
    include: { category: true, teachers: { include: { teacher: { select: { id: true, name: true } } } } },
    defaultOrder: [{ order: "asc" }, { createdAt: "desc" }],
  },
  "course-categories": {
    model: "courseCategory",
    label: "Kurs yoʻnalishlari",
    schema: courseCategorySchema,
    tags: [CacheTags.courses],
    search: ["name", "slug"],
    hasStatus: false,
    defaultOrder: [{ order: "asc" }],
  },
  teachers: {
    model: "teacher",
    label: "Oʻqituvchilar",
    schema: teacherSchema,
    tags: [CacheTags.teachers, CacheTags.courses],
    search: ["name", "title"],
    hasStatus: true,
    defaultOrder: [{ order: "asc" }, { createdAt: "desc" }],
  },
  services: {
    model: "service",
    label: "Media xizmatlar",
    schema: serviceSchema,
    tags: [CacheTags.services],
    search: ["title", "slug"],
    hasStatus: true,
    defaultOrder: [{ order: "asc" }, { createdAt: "desc" }],
  },
  "media-projects": {
    model: "mediaProject",
    label: "Media loyihalar",
    schema: mediaProjectSchema,
    tags: [CacheTags.mediaProjects],
    search: ["title", "client", "category"],
    hasStatus: true,
    include: { service: { select: { id: true, title: true } } },
    defaultOrder: [{ order: "asc" }, { createdAt: "desc" }],
  },
  testimonials: {
    model: "testimonial",
    label: "Fikrlar",
    schema: testimonialSchema,
    tags: [CacheTags.testimonials, CacheTags.courses],
    search: ["name", "quote"],
    hasStatus: true,
    include: { course: { select: { id: true, title: true } } },
    defaultOrder: [{ order: "asc" }, { createdAt: "desc" }],
  },
  results: {
    model: "result",
    label: "Natijalar",
    schema: resultSchema,
    tags: [CacheTags.results, CacheTags.courses],
    search: ["title", "studentName"],
    hasStatus: true,
    include: { course: { select: { id: true, title: true } } },
    defaultOrder: [{ order: "asc" }, { createdAt: "desc" }],
  },
  gallery: {
    model: "galleryItem",
    label: "Galereya",
    schema: galleryItemSchema,
    tags: [CacheTags.gallery],
    search: ["title", "alt"],
    hasStatus: true,
    defaultOrder: [{ order: "asc" }, { createdAt: "desc" }],
  },
  faq: {
    model: "faq",
    label: "FAQ",
    schema: faqSchema,
    tags: [CacheTags.faq, CacheTags.courses],
    search: ["question"],
    hasStatus: true,
    include: { course: { select: { id: true, title: true } } },
    defaultOrder: [{ order: "asc" }],
  },
  branches: {
    model: "branch",
    label: "Filiallar",
    schema: branchSchema,
    tags: [CacheTags.branches, CacheTags.settings],
    search: ["name", "address"],
    hasStatus: false,
    defaultOrder: [{ order: "asc" }],
  },
} as const satisfies Record<string, ResourceDef>;

export type ResourceKey = keyof typeof resources;

export function isResourceKey(key: string): key is ResourceKey {
  return Object.prototype.hasOwnProperty.call(resources, key);
}
