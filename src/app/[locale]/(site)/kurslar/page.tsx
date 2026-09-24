import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CourseIndex } from "@/components/site/home/course-index";
import { FaqSection } from "@/components/site/faq-section";
import { PageHeader } from "@/components/site/page-header";
import { Conversion } from "@/components/site/home/conversion";
import { JsonLd, breadcrumbJsonLd, courseListJsonLd } from "@/components/site/json-ld";
import { localizeAll } from "@/i18n/localize";
import { localizeCourses } from "@/i18n/localize-content";
import { localizeSettings } from "@/i18n/localize-settings";
import { resolveLocale, type LocaleParams } from "@/i18n/params";
import { getActiveBranches, getCourseCategories, getPublishedCourses, getPublishedFaqs, getPublishedServices } from "@/server/modules/content/public";
import { getSiteSettings } from "@/server/modules/settings/service";
import { pageMetadata } from "@/lib/seo";

type Props = { params: LocaleParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.courses" });
  return pageMetadata({ title: t("seo.title"), description: t("seo.description"), path: "/kurslar", locale, keywords: t.raw("seo.keywords") as string[] });
}

export default async function CoursesPage({ params }: Props) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const [t, tc, tl, rawCourses, rawCategories, rawFaqs, rawSettings, rawServices, rawBranches] = await Promise.all([
    getTranslations("pages.courses"),
    getTranslations("common"),
    getTranslations("pages.jsonLd"),
    getPublishedCourses(),
    getCourseCategories(),
    getPublishedFaqs(),
    getSiteSettings(),
    getPublishedServices(),
    getActiveBranches(),
  ]);
  const courses = localizeCourses(rawCourses, locale);
  const categories = localizeAll(rawCategories, locale);
  const faqs = localizeAll(rawFaqs, locale);
  const settings = localizeSettings(rawSettings, locale);
  const services = localizeAll(rawServices, locale);
  const branches = localizeAll(rawBranches, locale);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: tc("nav.home"), path: "/" }, { name: tc("nav.courses"), path: "/kurslar" }], locale)} />
      <JsonLd data={courseListJsonLd(courses, locale, tl("courseList"))} />
      <PageHeader eyebrow={t("eyebrow", { count: courses.length, city: settings.city })} title={t("title")} accent={t.raw("accent") as string[]} lead={t("lead")} />
      <CourseIndex courses={courses} categories={categories} heading={false} />
      <FaqSection faqs={faqs.filter((f) => f.scope !== "MEDIA")} />
      <Conversion courses={courses.map((c) => ({ value: c.slug, label: c.title }))} services={services.map((s) => ({ value: s.slug, label: s.title }))} branches={branches.map((b) => ({ value: b.id, label: b.name }))} settings={settings} />
    </>
  );
}
