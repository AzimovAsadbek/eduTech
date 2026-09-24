import type { Metadata } from "next";
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
import { getActiveBranches, getPublishedCourses, getPublishedGallery, getPublishedResults, getPublishedServices, getPublishedTestimonials } from "@/server/modules/content/public";
import { getSiteSettings } from "@/server/modules/settings/service";

export const metadata: Metadata = {
  title: "Natijalar — oʻquvchilarimiz hikoyalari",
  description: "EduTech bitiruvchilarining natijalari: ishga joylashish, real loyihalar, sertifikatlar va oʻsish hikoyalari.",
  alternates: { canonical: "/natijalar" },
};

const KIND: Record<string, string> = { PROJECT: "Loyiha", CAREER: "Karyera", GROWTH: "Oʻsish", CERTIFICATE: "Sertifikat" };

export default async function ResultsPage() {
  const [settings, results, testimonials, gallery, courses, services, branches] = await Promise.all([
    getSiteSettings(),
    getPublishedResults(),
    getPublishedTestimonials(),
    getPublishedGallery(),
    getPublishedCourses(),
    getPublishedServices(),
    getActiveBranches(),
  ]);
  const videoTestimonials = testimonials.filter((t) => t.videoUrl);
  const empty = !results.length && !testimonials.length;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Bosh sahifa", path: "/" }, { name: "Natijalar", path: "/natijalar" }])} />
      <PageHeader eyebrow="Natijalar" title="Bizning natijalarimiz gapiradi." accent={["gapiradi."]} lead="Raqamlar, loyihalar, ish joylari va bitiruvchilarning oʻz soʻzlari. Faqat real hikoyalar.">
        <dl className="mt-8 grid grid-cols-3 gap-4">
          {[
            [settings.stats.students, "oʻquvchi"],
            [settings.stats.courses, "yoʻnalish"],
            [settings.stats.projects, "loyiha"],
          ].map(([v, l]) => (
            <div key={l}>
              <dd className="font-display text-3xl font-bold tracking-tight">
                <Counter value={v} />
              </dd>
              <dt className="t-meta text-(--fg-muted)">{l}</dt>
            </div>
          ))}
        </dl>
      </PageHeader>

      {empty ? (
        <section className="container-x pb-24">
          <div className="rounded-(--radius-xl) border border-dashed border-(--line) p-12 text-center">
            <p className="t-h3">Hikoyalar tez orada</p>
            <p className="mt-3 text-(--fg-muted)">Oʻquvchilar natijalari va fikrlari admin paneldan nashr qilinishi bilan shu yerda koʻrinadi.</p>
          </div>
        </section>
      ) : null}

      {results.length ? (
        <section className="section-y pt-0" aria-labelledby="results-title">
          <div className="container-x">
            <SectionHeading eyebrow="Loyihalar va karyera" title={<span id="results-title">Bitiruvchilar nima yaratdi</span>} />
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
                    <p className="t-eyebrow text-orange">{KIND[r.kind]}</p>
                    <h3 className="t-h4 mt-2">{r.title}</h3>
                    {r.metricLabel ? <p className="font-display mt-3 text-3xl font-bold">{r.metricLabel}</p> : null}
                    {r.description ? <p className="mt-2 text-(--fg-muted)">{r.description}</p> : null}
                    <p className="t-meta mt-4 text-(--fg-muted)">{[r.studentName, r.course?.title].filter(Boolean).join(" · ")}</p>
                    {r.link ? (
                      <a href={r.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-semibold text-orange hover:underline">
                        Koʻrish →
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
        <section className="section-y bg-green-deep text-white" data-world="media" aria-labelledby="video-title">
          <div className="container-x">
            <SectionHeading eyebrow="Video fikrlar" title={<span id="video-title">Oʻz ovozi bilan</span>} />
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {videoTestimonials.map((t) => (
                <div key={t.id}>
                  <VideoEmbed url={t.videoUrl!} title={`${t.name} — fikr`} poster={t.photo} />
                  <p className="mt-4 font-semibold">{t.name}</p>
                  <p className="text-sm text-white/60">{t.resultLabel ?? t.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {testimonials.length ? (
        <section className="section-y" aria-labelledby="stories-title">
          <div className="container-x">
            <SectionHeading eyebrow="Fikrlar" title={<span id="stories-title">Bitiruvchilar soʻzi</span>} />
            <Reveal stagger={0.06} className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4 [&>*]:break-inside-avoid">
              {testimonials.map((t) => (
                <article key={t.id} className="rounded-(--radius-lg) border border-(--line) p-6">
                  <Quote size={20} className="text-orange" />
                  <p className="mt-4">{t.quote}</p>
                  <div className="mt-5 flex items-center gap-3 border-t border-(--line) pt-4">
                    <PlaceholderImage src={t.photo} alt={t.name} className="size-11 rounded-full" sizes="44px" />
                    <div>
                      <p className="font-semibold">{t.name}</p>
                      <p className="text-sm text-(--fg-muted)">{t.resultLabel ?? t.role ?? t.course?.title}</p>
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
            <SectionHeading eyebrow="Galereya" title="Dars, studiya, tadbir" />
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
