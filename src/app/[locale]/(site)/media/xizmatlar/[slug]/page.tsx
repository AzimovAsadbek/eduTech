import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowUpRight, Check } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { PortfolioPreview } from "@/components/site/home/portfolio-preview";
import { JsonLd, breadcrumbJsonLd, serviceJsonLd } from "@/components/site/json-ld";
import { MediaInquiry } from "@/components/site/media/media-inquiry";
import { ServiceView } from "@/components/site/media/service-view";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { routes } from "@/config/site";
import { localizeAll } from "@/i18n/localize";
import { localizeService } from "@/i18n/localize-content";
import { localizeSettings } from "@/i18n/localize-settings";
import { resolveLocale } from "@/i18n/params";
import { getPublishedServices, getServiceBySlug } from "@/server/modules/content/public";
import { getAuth } from "@/server/modules/auth/service";
import { getSiteSettings } from "@/server/modules/settings/service";
import { notFoundMetadata, pageMetadata } from "@/lib/seo";

type Params = Promise<{ locale: string; slug: string }>;
type Search = Promise<{ preview?: string }>;
type Step = { step: string; title: string; description: string };

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: Search }): Promise<Metadata> {
  const [locale, { slug }, { preview }] = await Promise.all([resolveLocale(params), params, searchParams]);
  const [t, raw] = await Promise.all([getTranslations({ locale, namespace: "pages.service" }), getServiceBySlug(slug, { preview: preview === "1" })]);
  if (!raw) return notFoundMetadata;
  const s = localizeService(raw, locale);
  return pageMetadata({
    title: s.seoTitle ?? t("seoTitle", { title: s.title }),
    description: s.seoDescription ?? `${s.tagline} ${s.description}`,
    path: `/media/xizmatlar/${s.slug}`,
    locale,
    image: s.coverImage,
    imageAlt: t("imageAlt", { title: s.title }),
    keywords: [t("keyword", { title: s.title }), ...s.attributes],
    noindex: preview === "1" || s.status !== "PUBLISHED",
  });
}

export default async function ServicePage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [locale, { slug }] = await Promise.all([resolveLocale(params), params]);
  setRequestLocale(locale);
  const { preview } = await searchParams;
  const isPreview = preview === "1" && Boolean(await getAuth());
  const [t, tp, tc, raw, rawAll, rawSettings] = await Promise.all([
    getTranslations("pages.service"),
    getTranslations("pages"),
    getTranslations("common"),
    getServiceBySlug(slug, { preview: isPreview }),
    getPublishedServices(),
    getSiteSettings(),
  ]);
  if (!raw) notFound();
  const service = localizeService(raw, locale);
  const all = localizeAll(rawAll, locale);
  const settings = localizeSettings(rawSettings, locale);
  const process = (service.process as Step[] | null) ?? [];
  const others = all.filter((s) => s.id !== service.id).slice(0, 4);

  return (
    <div data-world="media" className="bg-(--surface) text-white">
      <ServiceView slug={service.slug} />
      {isPreview ? <p className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-white">{tp("preview", { status: service.status })}</p> : null}
      <JsonLd data={serviceJsonLd(service, locale)} />
      <JsonLd data={breadcrumbJsonLd([{ name: tc("nav.home"), path: "/" }, { name: tc("nav.media"), path: "/media" }, { name: service.title, path: `/media/xizmatlar/${service.slug}` }], locale)} />

      <section className="relative overflow-hidden pt-36 pb-16 lg:pt-44">
        <div aria-hidden className="pointer-events-none absolute -top-32 right-[-10%] h-[60vh] w-[60vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.3),transparent)] blur-3xl" />
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow className="mb-5 text-white/60">{t("eyebrow")}</Eyebrow>
            <SplitHeading as="h1" text={service.title} className="t-display" scroll={false} />
            <Reveal delay={0.3}>
              <p className="t-h3 mt-6 font-normal text-orange">{service.tagline}</p>
              <p className="t-lead mt-5 max-w-xl text-white/70">{service.description}</p>
              <ul className="mt-8 flex flex-wrap gap-2">
                {service.attributes.map((a) => (
                  <li key={a} className="t-meta rounded-full border border-white/15 px-3 py-1.5 text-white/80">
                    {a}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal className="lg:col-span-5" delay={0.2}>
            <PlaceholderImage src={service.coverImage} alt={service.title} label={t("coverLabel")} className="aspect-[4/5] rounded-(--radius-xl)" priority />
          </Reveal>
        </div>
      </section>

      {service.deliverables.length ? (
        <section className="section-y border-t border-white/10" aria-labelledby="deliverables-title">
          <div className="container-x grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Eyebrow className="mb-3 text-white/60">{t("deliverables.eyebrow")}</Eyebrow>
              <h2 id="deliverables-title" className="t-h2">
                {t("deliverables.title")}
              </h2>
            </div>
            <Reveal stagger={0.06} as="ul" className="grid gap-3 sm:grid-cols-2 lg:col-span-8">
              {service.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-3 rounded-(--radius-lg) border border-white/10 bg-white/[0.03] p-5">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-orange text-white">
                    <Check size={14} />
                  </span>
                  <span className="font-medium">{d}</span>
                </li>
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}

      {process.length ? (
        <section className="section-y border-t border-white/10" aria-labelledby="process-title">
          <div className="container-x">
            <Eyebrow className="mb-3 text-white/60">{t("process.eyebrow")}</Eyebrow>
            <h2 id="process-title" className="t-h2 max-w-xl">
              {t("process.title")}
            </h2>
            <Reveal stagger={0.08} as="ol" className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {process.map((p) => (
                <li key={p.step} className="border-t border-white/15 pt-5">
                  <p className="font-display text-3xl font-bold text-orange">{p.step}</p>
                  <h3 className="t-h4 mt-4">{p.title}</h3>
                  <p className="mt-2 text-white/60">{p.description}</p>
                </li>
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}

      <PortfolioPreview projects={service.projects.map((p) => ({ ...p, service: { title: service.title, slug: service.slug } }))} limit={3} />

      <MediaInquiry services={all.map((s) => ({ value: s.slug, label: s.title }))} settings={settings} defaultServiceSlug={service.slug} />

      {others.length ? (
        <section className="border-t border-white/10 py-16">
          <div className="container-x">
            <p className="t-eyebrow mb-6 text-white/60">{t("others")}</p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((s) => (
                <li key={s.id}>
                  <Link href={routes.service(s.slug)} className="group flex items-center justify-between rounded-(--radius-lg) border border-white/10 p-5 transition-colors hover:border-orange">
                    <span className="font-semibold">{s.title}</span>
                    <ArrowUpRight size={18} className="text-white/50 transition-transform group-hover:rotate-45 group-hover:text-orange" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
