import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { JsonLd, breadcrumbJsonLd } from "@/components/site/json-ld";
import { BeforeAfter } from "@/components/site/media/before-after";
import { MediaInquiry } from "@/components/site/media/media-inquiry";
import { VideoEmbed } from "@/components/site/media/video-embed";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { routes } from "@/config/site";
import { localizeAll } from "@/i18n/localize";
import { localizeProject, localizeProjects } from "@/i18n/localize-content";
import { localizeSettings } from "@/i18n/localize-settings";
import { resolveLocale } from "@/i18n/params";
import { getProjectBySlug, getPublishedProjects, getPublishedServices } from "@/server/modules/content/public";
import { getAuth } from "@/server/modules/auth/service";
import { getSiteSettings } from "@/server/modules/settings/service";
import { notFoundMetadata, pageMetadata } from "@/lib/seo";

type Params = Promise<{ locale: string; slug: string }>;
type Search = Promise<{ preview?: string }>;
type Video = { url: string; title?: string; poster?: string };

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: Search }): Promise<Metadata> {
  const [locale, { slug }, { preview }] = await Promise.all([resolveLocale(params), params, searchParams]);
  const [t, raw] = await Promise.all([getTranslations({ locale, namespace: "pages.project" }), getProjectBySlug(slug, { preview: preview === "1" })]);
  if (!raw) return notFoundMetadata;
  const p = localizeProject(raw, locale);
  return pageMetadata({
    title: `${p.title} — ${p.client}`,
    description: p.description,
    path: `/media/portfolio/${p.slug}`,
    locale,
    image: p.coverImage,
    imageAlt: t("imageAlt", { title: p.title, client: p.client }),
    type: "article",
    noindex: preview === "1" || p.status !== "PUBLISHED",
  });
}

export default async function ProjectPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const [locale, { slug }] = await Promise.all([resolveLocale(params), params]);
  setRequestLocale(locale);
  const { preview } = await searchParams;
  const isPreview = preview === "1" && Boolean(await getAuth());
  const [t, tp, tc, raw, rawAll, rawServices, rawSettings] = await Promise.all([
    getTranslations("pages.project"),
    getTranslations("pages"),
    getTranslations("common"),
    getProjectBySlug(slug, { preview: isPreview }),
    getPublishedProjects(),
    getPublishedServices(),
    getSiteSettings(),
  ]);
  if (!raw) notFound();
  const project = localizeProject(raw, locale);
  const all = localizeProjects(rawAll, locale);
  const services = localizeAll(rawServices, locale);
  const settings = localizeSettings(rawSettings, locale);
  const videos = (project.videos as Video[] | null) ?? [];
  const idx = all.findIndex((p) => p.id === project.id);
  const next = all[(idx + 1) % all.length];

  const blocks = (
    [
      ["challenge", project.challenge],
      ["solution", project.solution],
      ["result", project.results],
    ] as const
  ).filter((b) => b[1]) as [("challenge" | "solution" | "result"), string][];

  return (
    <div data-world="media" className="bg-(--surface) text-white">
      <JsonLd data={breadcrumbJsonLd([{ name: tc("nav.home"), path: "/" }, { name: tc("nav.portfolio"), path: "/media/portfolio" }, { name: project.title, path: `/media/portfolio/${project.slug}` }], locale)} />
      {isPreview ? <p className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-white">{tp("preview", { status: project.status })}</p> : null}
      <section className="relative overflow-hidden pt-36 pb-12 lg:pt-44">
        <div className="container-x">
          <Eyebrow className="mb-5 text-white/60">
            {project.client} · {project.service?.title ?? project.category}
          </Eyebrow>
          <SplitHeading as="h1" text={project.title} className="t-display max-w-4xl" scroll={false} />
          <Reveal delay={0.3}>
            <p className="t-lead mt-6 max-w-2xl text-white/70">{project.description}</p>
          </Reveal>
          <Reveal delay={0.4} className="mt-10 grid gap-6 border-t border-white/10 pt-8 sm:grid-cols-3">
            <div>
              <p className="t-meta text-white/50">{t("meta.client")}</p>
              <p className="mt-1 font-semibold">{project.client}</p>
            </div>
            <div>
              <p className="t-meta text-white/50">{t("meta.service")}</p>
              <p className="mt-1 font-semibold">{project.service?.title ?? project.category}</p>
            </div>
            {project.tags.length ? (
              <div>
                <p className="t-meta text-white/50">{t("meta.tags")}</p>
                <p className="mt-1 font-semibold">{project.tags.join(" · ")}</p>
              </div>
            ) : null}
          </Reveal>
        </div>
      </section>

      <Reveal className="container-x">
        {videos[0] ? <VideoEmbed url={videos[0].url} title={videos[0].title ?? project.title} poster={videos[0].poster ?? project.coverImage} /> : <PlaceholderImage src={project.coverImage} alt={project.title} label={t("cover")} className="aspect-[16/9] rounded-(--radius-xl)" priority sizes="100vw" />}
      </Reveal>

      {blocks.length ? (
        <section className="section-y">
          <div className="container-x space-y-14">
            {blocks.map(([key, text], i) => {
              const title = t(`blocks.${key}.title`);
              const sub = t(`blocks.${key}.sub`);
              return (
                <Reveal key={key} className="grid gap-6 border-t border-white/10 pt-10 lg:grid-cols-12">
                  <div className="lg:col-span-4">
                    <p className="t-meta text-orange">{String(i + 1).padStart(2, "0")}</p>
                    <h2 className="t-h2 mt-2">{title}</h2>
                    {sub !== title ? <p className="t-meta mt-1 text-white/40">{sub}</p> : null}
                  </div>
                  <p className="t-lead whitespace-pre-line text-white/75 lg:col-span-7 lg:col-start-6">{text}</p>
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : null}

      {project.beforeImage && project.afterImage ? (
        <section className="container-x pb-24">
          <Eyebrow className="mb-6 text-white/60">{t("beforeAfter")}</Eyebrow>
          <BeforeAfter before={project.beforeImage} after={project.afterImage} alt={project.title} />
        </section>
      ) : null}

      {videos.length > 1 || project.images.length ? (
        <section className="container-x pb-24">
          <Eyebrow className="mb-6 text-white/60">{t("media")}</Eyebrow>
          <div className="grid gap-4 sm:grid-cols-2">
            {videos.slice(1).map((v) => (
              <VideoEmbed key={v.url} url={v.url} title={v.title ?? project.title} poster={v.poster} />
            ))}
            {project.images.map((img) => (
              <PlaceholderImage key={img} src={img} alt={project.title} className="aspect-[4/3] rounded-(--radius-lg)" sizes="(min-width:640px) 50vw, 100vw" />
            ))}
          </div>
        </section>
      ) : null}

      {next && next.id !== project.id ? (
        <Link href={routes.project(next.slug)} className="group block border-t border-white/10">
          <div className="container-x flex items-center justify-between py-12">
            <div>
              <p className="t-meta text-white/50">{t("next")}</p>
              <p className="t-h2 mt-2 transition-colors group-hover:text-orange">{next.title}</p>
            </div>
            <span className="grid size-14 place-items-center rounded-full border border-white/20 transition-[background-color,transform] group-hover:bg-orange group-hover:rotate-45">
              <ArrowUpRight />
            </span>
          </div>
        </Link>
      ) : null}

      <MediaInquiry services={services.map((s) => ({ value: s.slug, label: s.title }))} settings={settings} defaultServiceSlug={project.service?.slug} />
    </div>
  );
}
