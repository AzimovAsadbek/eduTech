import type { Metadata } from "next";
import { PortfolioPreview } from "@/components/site/home/portfolio-preview";
import { JsonLd, breadcrumbJsonLd } from "@/components/site/json-ld";
import { MediaInquiry } from "@/components/site/media/media-inquiry";
import { PageHeader } from "@/components/site/page-header";
import { getPublishedProjects, getPublishedServices } from "@/server/modules/content/public";
import { getSiteSettings } from "@/server/modules/settings/service";

export const metadata: Metadata = {
  title: "Portfolio — biz yaratgan kontentlar",
  description: "EduTech Media portfoliosi: Reels, YouTube, reklama roliklari, SMM kampaniyalari va brend loyihalari.",
  alternates: { canonical: "/media/portfolio" },
};

export default async function PortfolioPage() {
  const [projects, services, settings] = await Promise.all([getPublishedProjects(), getPublishedServices(), getSiteSettings()]);
  return (
    <div data-world="media" className="bg-(--surface) text-white">
      <JsonLd data={breadcrumbJsonLd([{ name: "Bosh sahifa", path: "/" }, { name: "Media", path: "/media" }, { name: "Portfolio", path: "/media/portfolio" }])} />
      <PageHeader dark eyebrow={`${projects.length} ta loyiha`} title="Biz yaratgan kontentlar." accent={["kontentlar."]} lead="Har bir ish — mijoz, muammo, strategiya va natija. Faqat real loyihalar." />
      {projects.length ? (
        <PortfolioPreview projects={projects} heading={false} limit={100} />
      ) : (
        <section className="container-x pb-24">
          <div className="rounded-(--radius-xl) border border-dashed border-white/15 p-12 text-center">
            <p className="t-h3">Portfolio tez orada</p>
            <p className="mt-3 text-white/60">Loyihalar admin paneldan nashr qilinishi bilan shu yerda paydo boʻladi.</p>
          </div>
        </section>
      )}
      <MediaInquiry services={services.map((s) => ({ value: s.slug, label: s.title }))} settings={settings} />
    </div>
  );
}
