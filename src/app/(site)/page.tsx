import { Marquee } from "@/components/motion/marquee";
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
import { JsonLd, organizationJsonLd } from "@/components/site/json-ld";
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

export default async function HomePage() {
  const [settings, courses, categories, services, projects, testimonials, results, gallery, faqs, branches] = await Promise.all([
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

  const opt = <T extends { slug?: string; id?: string; title?: string; name?: string }>(x: T) => ({ value: x.slug ?? x.id ?? "", label: x.title ?? x.name ?? "" });

  return (
    <>
      <JsonLd data={organizationJsonLd(settings)} />
      <Hero stats={settings.stats} heroImage={gallery.find((g) => g.category === "CLASSROOM")?.image} />
      <div className="border-y border-(--line) py-6">
        <Marquee items={courses.map((c) => c.title)} />
      </div>
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
