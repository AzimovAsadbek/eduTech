import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Conversion } from "@/components/site/home/conversion";
import { toCourseTile } from "@/components/site/course/course-tile-data";
import { CourseTeaser } from "@/components/site/home/course-teaser";
import { Hero } from "@/components/site/home/hero";
import { Journey } from "@/components/site/home/journey";
import { Proof } from "@/components/site/home/proof";
import { JsonLd, courseListJsonLd } from "@/components/site/json-ld";
import { localizeAll } from "@/i18n/localize";
import { localizeCourses } from "@/i18n/localize-content";
import { localizeSettings } from "@/i18n/localize-settings";
import { resolveLocale, type LocaleParams } from "@/i18n/params";
import { pageMetadata } from "@/lib/seo";
import { getActiveBranches, getPublishedCourses, getPublishedGallery } from "@/server/modules/content/public";
import { getSiteSettings } from "@/server/modules/settings/service";

type Props = { params: LocaleParams };

/** How many courses the homepage previews (two full rows: 3 × 2 on desktop, 2 × 3 on phones); the rest are one click away on /kurslar. */
const HOME_COURSES = 6;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.home" });
  return pageMetadata({ title: t("seo.title"), description: t("seo.description"), path: "/", locale });
}

export default async function HomePage({ params }: Props) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const [t, rawSettings, rawCourses, gallery, rawBranches] = await Promise.all([
    getTranslations("pages"),
    getSiteSettings(),
    getPublishedCourses(),
    getPublishedGallery(),
    getActiveBranches(),
  ]);
  const settings = localizeSettings(rawSettings, locale);
  const courses = localizeCourses(rawCourses, locale);
  const branches = localizeAll(rawBranches, locale);

  return (
    <>
      <JsonLd data={courseListJsonLd(courses, locale, t("jsonLd.courseList"))} />
      <Hero stats={settings.stats} heroImage={gallery.find((g) => g.category === "CLASSROOM")?.image} />
      <Journey />
      <CourseTeaser courses={courses.map(toCourseTile)} limit={HOME_COURSES} />
      <Proof stats={settings.stats} testimonials={[]} results={[]} compact />
      <Conversion courses={courses.map((c) => ({ value: c.slug, label: c.title }))} branches={branches.map((b) => ({ value: b.id, label: b.name }))} settings={settings} />
    </>
  );
}
