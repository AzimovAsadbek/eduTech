import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CourseBody } from "@/components/site/course/course-body";
import { CourseHero } from "@/components/site/course/course-hero";
import { JsonLd, breadcrumbJsonLd, courseJsonLd } from "@/components/site/json-ld";
import { localizeAll } from "@/i18n/localize";
import { localizeCourseDetail } from "@/i18n/localize-content";
import { resolveLocale } from "@/i18n/params";
import { getActiveBranches, getCourseBySlug } from "@/server/modules/content/public";
import { getAuth } from "@/server/modules/auth/service";
import { notFoundMetadata, pageMetadata } from "@/lib/seo";

type Params = Promise<{ locale: string; slug: string }>;
type Search = Promise<{ preview?: string }>;

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: Search }): Promise<Metadata> {
  const [locale, { slug }, { preview }] = await Promise.all([resolveLocale(params), params, searchParams]);
  const [t, raw] = await Promise.all([getTranslations({ locale, namespace: "pages.course" }), getCourseBySlug(slug, { preview: preview === "1" })]);
  if (!raw) return notFoundMetadata;
  const course = localizeCourseDetail(raw, locale);
  return pageMetadata({
    title: course.seoTitle ?? t("seoTitle", { title: course.title, role: course.roleLabel }),
    description: course.seoDescription ?? `${course.tagline} ${course.description}`,
    path: `/kurslar/${course.slug}`,
    locale,
    image: course.coverImage,
    imageAlt: t("imageAlt", { title: course.title }),
    keywords: [t("keywords.course", { title: course.title }), t("keywords.city", { title: course.title }), ...course.skills.slice(0, 4)],
    noindex: preview === "1" || course.status !== "PUBLISHED",
  });
}

export default async function CoursePage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [locale, { slug }] = await Promise.all([resolveLocale(params), params]);
  setRequestLocale(locale);
  const { preview } = await searchParams;
  // Draft preview is only available to a signed-in admin.
  const isPreview = preview === "1" && Boolean(await getAuth());
  const [t, tc, raw, rawBranches] = await Promise.all([getTranslations("pages"), getTranslations("common"), getCourseBySlug(slug, { preview: isPreview }), getActiveBranches()]);
  if (!raw) notFound();
  const course = localizeCourseDetail(raw, locale);
  const branches = localizeAll(rawBranches, locale);

  return (
    <>
      <JsonLd data={courseJsonLd(course, locale)} />
      <JsonLd data={breadcrumbJsonLd([{ name: tc("nav.home"), path: "/" }, { name: tc("nav.courses"), path: "/kurslar" }, { name: course.title, path: `/kurslar/${course.slug}` }], locale)} />
      {isPreview ? <p className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-white">{t("preview", { status: course.status })}</p> : null}
      <CourseHero course={course} />
      <CourseBody course={course} branches={branches.map((b) => ({ value: b.id, label: b.name }))} />
    </>
  );
}
