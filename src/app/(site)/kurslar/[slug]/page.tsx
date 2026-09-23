import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseBody } from "@/components/site/course/course-body";
import { CourseHero } from "@/components/site/course/course-hero";
import { JsonLd, breadcrumbJsonLd, courseJsonLd } from "@/components/site/json-ld";
import { getActiveBranches, getCourseBySlug, getPublishedCourses } from "@/server/modules/content/public";
import { getAuth } from "@/server/modules/auth/service";

type Params = Promise<{ slug: string }>;
type Search = Promise<{ preview?: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Kurs topilmadi" };
  const title = course.seoTitle ?? `${course.title} kursi`;
  const description = course.seoDescription ?? `${course.tagline} ${course.description.slice(0, 140)}`;
  return {
    title,
    description,
    alternates: { canonical: `/kurslar/${course.slug}` },
    openGraph: { title, description, type: "article", images: course.coverImage ? [{ url: course.coverImage }] : undefined },
  };
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
