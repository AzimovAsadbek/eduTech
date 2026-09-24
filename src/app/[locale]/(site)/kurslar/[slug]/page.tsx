import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseBody } from "@/components/site/course/course-body";
import { CourseHero } from "@/components/site/course/course-hero";
import { JsonLd, breadcrumbJsonLd, courseJsonLd } from "@/components/site/json-ld";
import { getActiveBranches, getCourseBySlug } from "@/server/modules/content/public";
import { getAuth } from "@/server/modules/auth/service";
import { notFoundMetadata, pageMetadata } from "@/lib/seo";

type Params = Promise<{ slug: string }>;
type Search = Promise<{ preview?: string }>;

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: Search }): Promise<Metadata> {
  const [{ slug }, { preview }] = await Promise.all([params, searchParams]);
  const course = await getCourseBySlug(slug, { preview: preview === "1" });
  if (!course) return notFoundMetadata;
  return pageMetadata({
    title: course.seoTitle ?? `${course.title} kursi — ${course.roleLabel}`,
    description: course.seoDescription ?? `${course.tagline} ${course.description}`,
    path: `/kurslar/${course.slug}`,
    image: course.coverImage,
    imageAlt: `${course.title} kursi — EduTech, Namangan`,
    keywords: [`${course.title} kursi`, `${course.title} Namangan`, ...course.skills.slice(0, 4)],
    noindex: preview === "1" || course.status !== "PUBLISHED",
  });
}

export default async function CoursePage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const { preview } = await searchParams;
  // Draft preview is only available to a signed-in admin.
  const isPreview = preview === "1" && Boolean(await getAuth());
  const [course, branches] = await Promise.all([getCourseBySlug(slug, { preview: isPreview }), getActiveBranches()]);
  if (!course) notFound();

  return (
    <>
      <JsonLd data={courseJsonLd(course)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Bosh sahifa", path: "/" }, { name: "Kurslar", path: "/kurslar" }, { name: course.title, path: `/kurslar/${course.slug}` }])} />
      {isPreview ? <p className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-white">Preview rejimi · {course.status}</p> : null}
      <CourseHero course={course} />
      <CourseBody course={course} branches={branches.map((b) => ({ value: b.id, label: b.name }))} />
    </>
  );
}
