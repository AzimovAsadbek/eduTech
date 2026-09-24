import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { Conversion } from "@/components/site/home/conversion";
import { Manifesto } from "@/components/site/home/manifesto";
import { JsonLd, breadcrumbJsonLd, webPageJsonLd } from "@/components/site/json-ld";
import { PageHeader } from "@/components/site/page-header";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { localizeAll } from "@/i18n/localize";
import { localizeCourses, localizeTeachers } from "@/i18n/localize-content";
import { localizeSettings } from "@/i18n/localize-settings";
import { resolveLocale, type LocaleParams } from "@/i18n/params";
import { getActiveBranches, getPublishedCourses, getPublishedGallery, getPublishedServices, getPublishedTeachers } from "@/server/modules/content/public";
import { getSiteSettings } from "@/server/modules/settings/service";
import { pageMetadata } from "@/lib/seo";

type Props = { params: LocaleParams };
type Pillar = { key: string; title: string; description: string };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.about" });
  return pageMetadata({ title: t("seo.title"), description: t("seo.description"), path: "/biz-haqimizda", locale });
}

export default async function AboutPage({ params }: Props) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const [t, tc, tl, rawSettings, rawTeachers, gallery, rawCourses, rawServices, rawBranches] = await Promise.all([
    getTranslations("pages.about"),
    getTranslations("common"),
    getTranslations("pages.jsonLd"),
    getSiteSettings(),
    getPublishedTeachers(),
    getPublishedGallery(),
    getPublishedCourses(),
    getPublishedServices(),
    getActiveBranches(),
  ]);
  const settings = localizeSettings(rawSettings, locale);
  const teachers = localizeTeachers(rawTeachers, locale);
  const courses = localizeCourses(rawCourses, locale);
  const services = localizeAll(rawServices, locale);
  const branches = localizeAll(rawBranches, locale);
  const campus = gallery.filter((g) => g.category === "CAMPUS" || g.category === "CLASSROOM").slice(0, 3);
  const pillars = t.raw("pillars") as Pillar[];
  const envLabels = t.raw("environment.labels") as string[];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: tc("nav.home"), path: "/" }, { name: tc("nav.about"), path: "/biz-haqimizda" }], locale)} />
      <JsonLd data={webPageJsonLd("AboutPage", tl("about"), "/biz-haqimizda", locale)} />
      <PageHeader eyebrow={t("eyebrow", { city: settings.city })} title={t("title")} accent={t.raw("accent") as string[]} lead={t("lead")} />

      <section className="section-y pt-0" aria-labelledby="pillars-title">
        <div className="container-x">
          <Reveal stagger={0.08} className="grid gap-px overflow-hidden rounded-(--radius-xl) border border-(--line) bg-(--line) md:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p, i) => (
              <div key={p.key} className="bg-paper p-8">
                <p className="font-display text-4xl font-bold text-orange">{p.key}</p>
                <h2 id={i === 0 ? "pillars-title" : undefined} className="t-h4 mt-6">
                  {p.title}
                </h2>
                <p className="mt-2 text-(--fg-muted)">{p.description}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <Manifesto gallery={gallery} />

      <section className="section-y bg-paper-2" aria-labelledby="philosophy-title">
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Eyebrow className="mb-4">{t("philosophy.eyebrow")}</Eyebrow>
            <SplitHeading as="h2" id="philosophy-title" text={t("philosophy.title")} accent={t.raw("philosophy.accent") as string[]} className="t-h1" />
          </div>
          <Reveal className="space-y-6 text-lg leading-relaxed text-(--fg-muted) lg:col-span-6 lg:col-start-7">
            <p>{t("philosophy.p1")}</p>
            <p>{t("philosophy.p2")}</p>
            <p>{t("philosophy.p3", { city: settings.city })}</p>
          </Reveal>
        </div>
      </section>

      {teachers.length ? (
        <section className="section-y" aria-labelledby="team-title">
          <div className="container-x">
            <SectionHeading eyebrow={t("team.eyebrow")} title={<span id="team-title">{t("team.title")}</span>} lead={t("team.lead")} align="split" />
            <Reveal stagger={0.06} className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {teachers.map((m) => (
                <article key={m.id} className="group">
                  <PlaceholderImage src={m.photo} alt={m.name} className="aspect-[4/5] rounded-(--radius-lg) transition-transform duration-500 group-hover:scale-[1.01]" sizes="(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" />
                  <h3 className="t-h4 mt-4">{m.name}</h3>
                  <p className="text-sm text-orange">{m.title}</p>
                  {m.courses.length ? <p className="t-meta mt-2 text-(--fg-muted)">{m.courses.map((c) => c.course.title).join(" · ")}</p> : null}
                </article>
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}

      <section className="section-y bg-ink text-white" data-world="media" aria-labelledby="env-title">
        <div className="container-x">
          <SectionHeading eyebrow={t("environment.eyebrow")} title={<span id="env-title">{t("environment.title")}</span>} lead={t("environment.lead")} align="split" />
          <Reveal stagger={0.08} className="mt-12 grid gap-4 md:grid-cols-3">
            {(campus.length ? campus : [null, null, null]).map((g, i) => (
              <PlaceholderImage key={g?.id ?? i} src={g?.image} alt={g?.alt ?? t("environment.alt")} label={g ? undefined : envLabels[i]} className={`rounded-(--radius-lg) ${i === 0 ? "aspect-[4/5] md:row-span-2" : "aspect-[4/3]"}`} sizes="(min-width:768px) 33vw, 100vw" />
            ))}
          </Reveal>
        </div>
      </section>

      <Conversion courses={courses.map((c) => ({ value: c.slug, label: c.title }))} services={services.map((s) => ({ value: s.slug, label: s.title }))} branches={branches.map((b) => ({ value: b.id, label: b.name }))} settings={settings} />
    </>
  );
}
