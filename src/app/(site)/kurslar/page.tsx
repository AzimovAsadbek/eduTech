import { CourseIndex } from "@/components/site/home/course-index";
import { FaqSection } from "@/components/site/faq-section";
import { PageHeader } from "@/components/site/page-header";
import { Conversion } from "@/components/site/home/conversion";
import { JsonLd, breadcrumbJsonLd, courseListJsonLd } from "@/components/site/json-ld";
import { getActiveBranches, getCourseCategories, getPublishedCourses, getPublishedFaqs, getPublishedServices } from "@/server/modules/content/public";
import { getSiteSettings } from "@/server/modules/settings/service";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Kurslar — IT, AI, media va marketing",
  description: "Namangandagi EduTech kurslari: dasturlash, robototexnika, sunʼiy intellekt, IT-Kids, notiqlik, mobilografiya, videografiya, SMM va target. Amaliy taʼlim, real loyihalar.",
  path: "/kurslar",
  keywords: ["dasturlash kursi Namangan", "IT kurslari Namangan", "SMM kursi", "robototexnika kursi"],
});

export default async function CoursesPage() {
  const [courses, categories, faqs, settings, services, branches] = await Promise.all([
    getPublishedCourses(),
    getCourseCategories(),
    getPublishedFaqs(),
    getSiteSettings(),
    getPublishedServices(),
    getActiveBranches(),
  ]);
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Bosh sahifa", path: "/" }, { name: "Kurslar", path: "/kurslar" }])} />
      <JsonLd data={courseListJsonLd(courses)} />
      <PageHeader eyebrow={`${courses.length} ta yoʻnalish · ${settings.city}`} title="Kasb tanlang. Qolganini biz oʻrgatamiz." accent={["Kasb"]} lead="Har bir kurs ish beruvchi talabidan boshlab tuzilgan. Davomiylik, format va natija — hammasi ochiq." />
      <CourseIndex courses={courses} categories={categories} heading={false} />
      <FaqSection faqs={faqs.filter((f) => f.scope !== "MEDIA")} />
      <Conversion courses={courses.map((c) => ({ value: c.slug, label: c.title }))} services={services.map((s) => ({ value: s.slug, label: s.title }))} branches={branches.map((b) => ({ value: b.id, label: b.name }))} settings={settings} />
    </>
  );
}
