import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { FaqSection } from "@/components/site/faq-section";
import { MediaHero } from "@/components/site/home/media-hero";
import { PortfolioPreview } from "@/components/site/home/portfolio-preview";
import { ServiceExplorer } from "@/components/site/home/service-explorer";
import { JsonLd, breadcrumbJsonLd, serviceListJsonLd } from "@/components/site/json-ld";
import { MediaInquiry } from "@/components/site/media/media-inquiry";
import { SectionHeading } from "@/components/ui/section-heading";
import { localizeAll } from "@/i18n/localize";
import { localizeProjects } from "@/i18n/localize-content";
import { localizeSettings } from "@/i18n/localize-settings";
import { resolveLocale, type LocaleParams } from "@/i18n/params";
import { getPublishedFaqs, getPublishedProjects, getPublishedServices } from "@/server/modules/content/public";
import { getSiteSettings } from "@/server/modules/settings/service";
import { pageMetadata } from "@/lib/seo";

type Props = { params: LocaleParams };
type Step = { title: string; description: string };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.media" });
  return pageMetadata({ title: t("seo.title"), description: t("seo.description"), path: "/media", locale, keywords: t.raw("seo.keywords") as string[] });
}

export default async function MediaPage({ params }: Props) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const [t, tc, tl, rawServices, rawProjects, rawFaqs, rawSettings] = await Promise.all([
    getTranslations("pages.media"),
    getTranslations("common"),
    getTranslations("pages.jsonLd"),
    getPublishedServices(),
    getPublishedProjects(),
    getPublishedFaqs(),
    getSiteSettings(),
  ]);
  const services = localizeAll(rawServices, locale);
  const projects = localizeProjects(rawProjects, locale);
  const faqs = localizeAll(rawFaqs, locale);
  const settings = localizeSettings(rawSettings, locale);
  const steps = t.raw("process.steps") as Step[];
  return (
    <div data-world="media" className="bg-(--surface) text-white">
      <JsonLd data={breadcrumbJsonLd([{ name: tc("nav.home"), path: "/" }, { name: tc("nav.media"), path: "/media" }], locale)} />
      <JsonLd data={serviceListJsonLd(services, locale, tl("serviceList"))} />
      <MediaHero standalone />
      <ServiceExplorer services={services} />

      <section className="section-y border-t border-white/10" aria-labelledby="process-title">
        <div className="container-x">
          <SectionHeading eyebrow={t("process.eyebrow")} title={<span id="process-title">{t("process.title")}</span>} lead={t("process.lead")} align="split" />
          <Reveal stagger={0.08} as="ol" className="mt-14 grid gap-px overflow-hidden rounded-(--radius-xl) border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((p, i) => (
              <li key={p.title} className="bg-(--surface) p-8">
                <p className="font-display text-4xl font-bold text-orange">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="t-h4 mt-6">{p.title}</h3>
                <p className="mt-2 text-white/60">{p.description}</p>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      <PortfolioPreview projects={projects} />
      <FaqSection faqs={faqs.filter((f) => f.scope !== "EDU")} title={t("faqTitle")} />
      <MediaInquiry services={services.map((s) => ({ value: s.slug, label: s.title }))} settings={settings} />
    </div>
  );
}
