import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PortfolioPreview } from "@/components/site/home/portfolio-preview";
import { JsonLd, breadcrumbJsonLd } from "@/components/site/json-ld";
import { MediaInquiry } from "@/components/site/media/media-inquiry";
import { PageHeader } from "@/components/site/page-header";
import { localizeAll } from "@/i18n/localize";
import { localizeProjects } from "@/i18n/localize-content";
import { localizeSettings } from "@/i18n/localize-settings";
import { resolveLocale, type LocaleParams } from "@/i18n/params";
import { getPublishedProjects, getPublishedServices } from "@/server/modules/content/public";
import { getSiteSettings } from "@/server/modules/settings/service";
import { pageMetadata } from "@/lib/seo";

type Props = { params: LocaleParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.portfolio" });
  return pageMetadata({ title: t("seo.title"), description: t("seo.description"), path: "/media/portfolio", locale });
}

export default async function PortfolioPage({ params }: Props) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const [t, tc, rawProjects, rawServices, rawSettings] = await Promise.all([getTranslations("pages.portfolio"), getTranslations("common"), getPublishedProjects(), getPublishedServices(), getSiteSettings()]);
  const projects = localizeProjects(rawProjects, locale);
  const services = localizeAll(rawServices, locale);
  const settings = localizeSettings(rawSettings, locale);
  return (
    <div data-world="media" className="bg-(--surface) text-white">
      <JsonLd data={breadcrumbJsonLd([{ name: tc("nav.home"), path: "/" }, { name: tc("nav.media"), path: "/media" }, { name: tc("nav.portfolio"), path: "/media/portfolio" }], locale)} />
      <PageHeader dark eyebrow={t("eyebrow", { count: projects.length })} title={t("title")} accent={t.raw("accent") as string[]} lead={t("lead")} />
      {projects.length ? (
        <PortfolioPreview projects={projects} heading={false} limit={100} />
      ) : (
        <section className="container-x pb-24">
          <div className="rounded-(--radius-xl) border border-dashed border-white/15 p-12 text-center">
            <p className="t-h3">{t("empty.title")}</p>
            <p className="mt-3 text-white/60">{t("empty.text")}</p>
          </div>
        </section>
      )}
      <MediaInquiry services={services.map((s) => ({ value: s.slug, label: s.title }))} settings={settings} />
    </div>
  );
}
