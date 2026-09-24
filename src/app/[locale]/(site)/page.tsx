import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Conversion } from "@/components/site/home/conversion";
import { CourseIndex } from "@/components/site/home/course-index";
import { Hero } from "@/components/site/home/hero";
import { Journey } from "@/components/site/home/journey";
import { Manifesto } from "@/components/site/home/manifesto";
import { MediaHero } from "@/components/site/home/media-hero";
import { PortfolioPreview } from "@/components/site/home/portfolio-preview";
import { Proof } from "@/components/site/home/proof";
import { ServiceExplorer } from "@/components/site/home/service-explorer";
import { WorldShift } from "@/components/site/home/world-shift";
import { FaqSection } from "@/components/site/faq-section";
import { JsonLd, courseListJsonLd } from "@/components/site/json-ld";
import { localizeAll } from "@/i18n/localize";
import { localizeCourses, localizeProjects, localizeWithCourse } from "@/i18n/localize-content";
import { localizeSettings } from "@/i18n/localize-settings";
import { resolveLocale, type LocaleParams } from "@/i18n/params";
import { pageMetadata } from "@/lib/seo";
import {
  getActiveBranches,
  getCourseCategories,
  getPublishedCourses,
  getPublishedFaqs,
  getPublishedGallery,
  getPublishedProjects,
  getPublishedResults,
  getPublishedServices,
  getPublishedTestimonials,
} from "@/server/modules/content/public";
import { getSiteSettings } from "@/server/modules/settings/service";

type Props = { params: LocaleParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.home" });
  return pageMetadata({ title: t("seo.title"), description: t("seo.description"), path: "/", locale });
}

export default async function HomePage({ params }: Props) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const [t, rawSettings, rawCourses, rawCategories, rawServices, rawProjects, rawTestimonials, rawResults, gallery, rawFaqs, rawBranches] = await Promise.all([
    getTranslations("pages"),
    getSiteSettings(),
    getPublishedCourses(),
    getCourseCategories(),
    getPublishedServices(),
    getPublishedProjects(),
    getPublishedTestimonials(),
    getPublishedResults(),
    getPublishedGallery(),
    getPublishedFaqs(),
    getActiveBranches(),
  ]);
  const settings = localizeSettings(rawSettings, locale);
  const courses = localizeCourses(rawCourses, locale);
  const categories = localizeAll(rawCategories, locale);
  const services = localizeAll(rawServices, locale);
  const projects = localizeProjects(rawProjects, locale);
  const testimonials = localizeWithCourse(rawTestimonials, locale);
  const results = localizeWithCourse(rawResults, locale);
  const faqs = localizeAll(rawFaqs, locale);
  const branches = localizeAll(rawBranches, locale);

  const opt = <T extends { slug?: string; id?: string; title?: string; name?: string }>(x: T) => ({ value: x.slug ?? x.id ?? "", label: x.title ?? x.name ?? "" });

  return (
    <>
      <JsonLd data={courseListJsonLd(courses, locale, t("jsonLd.courseList"))} />
      <Hero stats={settings.stats} heroImage={gallery.find((g) => g.category === "CLASSROOM")?.image} directions={courses.map((c) => ({ slug: c.slug, title: c.title }))} />
      <Journey />
      <CourseIndex courses={courses} categories={categories} />
      <Manifesto gallery={gallery} />
      <Proof stats={settings.stats} testimonials={testimonials} results={results} />
      <WorldShift />
      <MediaHero />
      <ServiceExplorer services={services} />
      <PortfolioPreview projects={projects} />
      <FaqSection faqs={faqs} />
      <Conversion courses={courses.map(opt)} services={services.map(opt)} branches={branches.map(opt)} settings={settings} />
    </>
  );
}
