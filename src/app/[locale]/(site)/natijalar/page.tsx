import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Quote } from "lucide-react";
import { Counter } from "@/components/motion/counter";
import { Reveal } from "@/components/motion/reveal";
import { Conversion } from "@/components/site/home/conversion";
import { JsonLd, breadcrumbJsonLd } from "@/components/site/json-ld";
import { BeforeAfter } from "@/components/site/media/before-after";
import { VideoEmbed } from "@/components/site/media/video-embed";
import { PageHeader } from "@/components/site/page-header";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { localizeAll } from "@/i18n/localize";
import { localizeCourses, localizeWithCourse } from "@/i18n/localize-content";
import { localizeSettings } from "@/i18n/localize-settings";
import { resolveLocale, type LocaleParams } from "@/i18n/params";
import { getActiveBranches, getPublishedCourses, getPublishedGallery, getPublishedResults, getPublishedServices, getPublishedTestimonials } from "@/server/modules/content/public";
import { getSiteSettings } from "@/server/modules/settings/service";
import { pageMetadata } from "@/lib/seo";

type Props = { params: LocaleParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.results" });
  return pageMetadata({ title: t("seo.title"), description: t("seo.description"), path: "/natijalar", locale });
}

export default async function ResultsPage({ params }: Props) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const [t, tc, rawSettings, rawResults, rawTestimonials, gallery, rawCourses, rawServices, rawBranches] = await Promise.all([
    getTranslations("pages.results"),
    getTranslations("common"),
    getSiteSettings(),
    getPublishedResults(),
    getPublishedTestimonials(),
    getPublishedGallery(),
    getPublishedCourses(),
    getPublishedServices(),
    getActiveBranches(),
  ]);
  const settings = localizeSettings(rawSettings, locale);
  const results = localizeWithCourse(rawResults, locale);
  const testimonials = localizeWithCourse(rawTestimonials, locale);
  const courses = localizeCourses(rawCourses, locale);
  const services = localizeAll(rawServices, locale);
  const branches = localizeAll(rawBranches, locale);
  const videoTestimonials = testimonials.filter((t) => t.videoUrl);
  const empty = !results.length && !testimonials.length;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: tc("nav.home"), path: "/" }, { name: tc("nav.results"), path: "/natijalar" }], locale)} />
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} accent={t.raw("accent") as string[]} lead={t("lead")}>
        <dl className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
          {[
            [settings.stats.students, tc("stats.students")],
            [settings.stats.courses, tc("stats.courses")],
            [settings.stats.projects, t("statProjects")],
          ].map(([v, l]) => (
            <div key={l} className="glass rounded-(--radius-lg) px-3 py-3 sm:px-4">
              <dd className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                <Counter value={v} />
              </dd>
              <dt className="t-meta mt-1 text-(--fg-muted)">{l}</dt>
            </div>
          ))}
        </dl>
      </PageHeader>

      {empty ? (
        <section className="container-x pb-24">
          <div className="glass rounded-(--radius-xl) p-8 text-center sm:p-12">
            <p className="t-h3">{t("empty.title")}</p>
            <p className="mt-3 text-(--fg-muted)">{t("empty.text")}</p>
          </div>
        </section>
      ) : null}

      {results.length ? (
        <section className="section-y pt-0" aria-labelledby="results-title">
          <div className="container-x">
            <SectionHeading eyebrow={t("projects.eyebrow")} title={<span id="results-title">{t("projects.title")}</span>} />
            <Reveal stagger={0.06} className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((r) => (
                <article key={r.id} className="group overflow-hidden rounded-(--radius-lg) border border-(--line) bg-paper">
                  {r.beforeImage && r.afterImage ? (
                    <div className="p-2">
                      <BeforeAfter before={r.beforeImage} after={r.afterImage} alt={r.title} />
                    </div>
                  ) : (
                    <PlaceholderImage src={r.image} alt={r.title} className="aspect-[4/3]" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
                  )}
                  <div className="p-6">
                    <p className="t-eyebrow text-orange">{tc(`resultKind.${r.kind}`)}</p>
                    <h3 className="t-h4 mt-2">{r.title}</h3>
                    {r.metricLabel ? <p className="font-display mt-3 text-3xl font-bold">{r.metricLabel}</p> : null}
                    {r.description ? <p className="mt-2 text-(--fg-muted)">{r.description}</p> : null}
                    <p className="t-meta mt-4 text-(--fg-muted)">{[r.studentName, r.course?.title].filter(Boolean).join(" · ")}</p>
                    {r.link ? (
                      <a href={r.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-semibold text-orange hover:underline">
                        {t("view")}
                      </a>
                    ) : null}
                  </div>
                </article>
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}

      {videoTestimonials.length ? (
        <section className="section-y bg-ink text-white" data-world="media" aria-labelledby="video-title">
          <div className="container-x">
            <SectionHeading eyebrow={t("video.eyebrow")} title={<span id="video-title">{t("video.title")}</span>} />
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {videoTestimonials.map((v) => (
                <div key={v.id}>
                  <VideoEmbed url={v.videoUrl!} title={t("video.videoTitle", { name: v.name })} poster={v.photo} />
                  <p className="mt-4 font-semibold">{v.name}</p>
                  <p className="text-sm text-white/60">{v.resultLabel ?? v.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {testimonials.length ? (
        <section className="section-y" aria-labelledby="stories-title">
          <div className="container-x">
            <SectionHeading eyebrow={t("stories.eyebrow")} title={<span id="stories-title">{t("stories.title")}</span>} />
            <Reveal stagger={0.06} className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
              {testimonials.map((v) => (
                <article key={v.id} className="rounded-(--radius-lg) border border-(--line) p-6">
                  <Quote size={20} className="text-orange" />
                  <p className="mt-4">{v.quote}</p>
                  <div className="mt-5 flex items-center gap-3 border-t border-(--line) pt-4">
                    <PlaceholderImage src={v.photo} alt={v.name} className="size-11 rounded-full" sizes="44px" />
                    <div>
                      <p className="font-semibold">{v.name}</p>
                      <p className="text-sm text-(--fg-muted)">{v.resultLabel ?? v.role ?? v.course?.title}</p>
                    </div>
                  </div>
                </article>
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}

      {gallery.length ? (
        <section className="section-y bg-paper-2">
          <div className="container-x">
            <SectionHeading eyebrow={t("gallery.eyebrow")} title={t("gallery.title")} />
            <Reveal stagger={0.05} className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
              {gallery.map((g, i) => (
                <PlaceholderImage key={g.id} src={g.image} alt={g.alt} className={`rounded-(--radius-lg) ${i % 5 === 0 ? "col-span-2 aspect-[16/10]" : "aspect-[4/5]"}`} sizes="(min-width:768px) 25vw, 50vw" />
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}

      <Conversion courses={courses.map((c) => ({ value: c.slug, label: c.title }))} services={services.map((s) => ({ value: s.slug, label: s.title }))} branches={branches.map((b) => ({ value: b.id, label: b.name }))} settings={settings} />
    </>
  );
}
