import "server-only";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { CacheTags } from "@/server/cache";
import { getAuth } from "@/server/modules/auth/service";

const PUBLISHED = { status: "PUBLISHED" } as const;

export const courseCardSelect = {
  id: true,
  slug: true,
  title: true,
  roleLabel: true,
  tagline: true,
  level: true,
  format: true,
  durationLabel: true,
  priceLabel: true,
  ageLabel: true,
  accent: true,
  coverImage: true,
  featured: true,
  order: true,
  outcomes: true,
  category: { select: { id: true, slug: true, name: true } },
} satisfies Prisma.CourseSelect;

export type CourseCard = Prisma.CourseGetPayload<{ select: typeof courseCardSelect }>;

export const getPublishedCourses = unstable_cache(
  () => db.course.findMany({ where: PUBLISHED, select: courseCardSelect, orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
  ["public-courses"],
  { tags: [CacheTags.courses] },
);

export const getCourseCategories = unstable_cache(
  () => db.courseCategory.findMany({ orderBy: { order: "asc" } }),
  ["public-course-categories"],
  { tags: [CacheTags.courses] },
);

export const courseDetailInclude = {
  category: true,
  teachers: { include: { teacher: true } },
  testimonials: { where: PUBLISHED, orderBy: { order: "asc" }, take: 6 },
  results: { where: PUBLISHED, orderBy: { order: "asc" }, take: 6 },
  faqs: { where: PUBLISHED, orderBy: { order: "asc" } },
} satisfies Prisma.CourseInclude;

export type CourseDetail = Prisma.CourseGetPayload<{ include: typeof courseDetailInclude }>;

/**
 * Draft preview is only honoured for a signed-in admin. Enforced here (not only in the page) so that
 * `generateMetadata` and any other caller can never leak an unpublished title/description to anonymous visitors.
 */
async function canPreview(opts?: { preview?: boolean }): Promise<boolean> {
  return Boolean(opts?.preview) && Boolean(await getAuth());
}

export const getCourseBySlug = async (slug: string, opts?: { preview?: boolean }) =>
  (await canPreview(opts))
    ? db.course.findUnique({ where: { slug }, include: courseDetailInclude })
    : unstable_cache(
        () => db.course.findFirst({ where: { slug, ...PUBLISHED }, include: courseDetailInclude }),
        ["public-course", slug],
        { tags: [CacheTags.courses, CacheTags.teachers, CacheTags.testimonials, CacheTags.results, CacheTags.faq] },
      )();

export const getPublishedServices = unstable_cache(
  () => db.service.findMany({ where: PUBLISHED, orderBy: [{ order: "asc" }, { createdAt: "asc" }] }),
  ["public-services"],
  { tags: [CacheTags.services] },
);

export const getServiceBySlug = async (slug: string, opts?: { preview?: boolean }) =>
  (await canPreview(opts))
    ? db.service.findUnique({ where: { slug }, include: { projects: { where: PUBLISHED, orderBy: { order: "asc" }, take: 6 } } })
    : unstable_cache(
        () =>
          db.service.findFirst({
            where: { slug, ...PUBLISHED },
            include: { projects: { where: PUBLISHED, orderBy: { order: "asc" }, take: 6 } },
          }),
        ["public-service", slug],
        { tags: [CacheTags.services, CacheTags.mediaProjects] },
      )();

export const getPublishedProjects = unstable_cache(
  () =>
    db.mediaProject.findMany({
      where: PUBLISHED,
      include: { service: { select: { title: true, slug: true } } },
      orderBy: [{ featured: "desc" }, { order: "asc" }, { createdAt: "desc" }],
    }),
  ["public-projects"],
  { tags: [CacheTags.mediaProjects] },
);

export const getProjectBySlug = async (slug: string, opts?: { preview?: boolean }) =>
  (await canPreview(opts))
    ? db.mediaProject.findUnique({ where: { slug }, include: { service: true } })
    : unstable_cache(
        () => db.mediaProject.findFirst({ where: { slug, ...PUBLISHED }, include: { service: true } }),
        ["public-project", slug],
        { tags: [CacheTags.mediaProjects] },
      )();

export const getPublishedTeachers = unstable_cache(
  () => db.teacher.findMany({ where: PUBLISHED, orderBy: { order: "asc" }, include: { courses: { include: { course: { select: { title: true, slug: true } } } } } }),
  ["public-teachers"],
  { tags: [CacheTags.teachers, CacheTags.courses] },
);

export const getPublishedResults = unstable_cache(
  () => db.result.findMany({ where: PUBLISHED, orderBy: [{ featured: "desc" }, { order: "asc" }], include: { course: { select: { title: true, slug: true } } } }),
  ["public-results"],
  { tags: [CacheTags.results] },
);

export const getPublishedTestimonials = unstable_cache(
  () => db.testimonial.findMany({ where: PUBLISHED, orderBy: { order: "asc" }, include: { course: { select: { title: true, slug: true } } } }),
  ["public-testimonials"],
  { tags: [CacheTags.testimonials] },
);

export const getPublishedGallery = unstable_cache(
  () => db.galleryItem.findMany({ where: PUBLISHED, orderBy: { order: "asc" } }),
  ["public-gallery"],
  { tags: [CacheTags.gallery] },
);

export const getPublishedFaqs = unstable_cache(
  () => db.faq.findMany({ where: { ...PUBLISHED, courseId: null }, orderBy: { order: "asc" } }),
  ["public-faqs"],
  { tags: [CacheTags.faq] },
);

export const getActiveBranches = unstable_cache(
  () => db.branch.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
  ["public-branches"],
  { tags: [CacheTags.branches] },
);

/** Slugs for sitemap generation. */
export const getPublicSlugs = unstable_cache(
  async () => {
    const [courses, services, projects] = await Promise.all([
      db.course.findMany({ where: PUBLISHED, select: { slug: true, updatedAt: true } }),
      db.service.findMany({ where: PUBLISHED, select: { slug: true, updatedAt: true } }),
      db.mediaProject.findMany({ where: PUBLISHED, select: { slug: true, updatedAt: true } }),
    ]);
    return { courses, services, projects };
  },
  ["public-slugs"],
  { tags: [CacheTags.courses, CacheTags.services, CacheTags.mediaProjects] },
);
