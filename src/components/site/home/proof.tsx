import { Link } from "@/i18n/navigation";
import { ArrowUpRight, Quote } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { Counter } from "@/components/motion/counter";
import { Reveal } from "@/components/motion/reveal";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { routes } from "@/config/site";
import { Rail } from "@/components/site/rail";

type Testimonial = Prisma.TestimonialGetPayload<{ include: { course: { select: { title: true; slug: true } } } }>;
type Result = Prisma.ResultGetPayload<{ include: { course: { select: { title: true; slug: true } } } }>;

interface Props {
  stats: { students: string; courses: string; projects: string };
  /** Homepage teaser: numbers and a link only — stories live on /natijalar. */
  compact?: boolean;
  testimonials: Testimonial[];
  results: Result[];
}

/**
 * PROOF: numbers first, then real stories. Story rails only render when the CMS has published entries —
 * no fabricated testimonials.
 */
export async function Proof({ stats, testimonials, results, compact }: Props) {
  const [t, tc] = await Promise.all([getTranslations("proof"), getTranslations("common")]);
  const hasStories = !compact && (testimonials.length > 0 || results.length > 0);
  return (
    <section className="section-y" aria-labelledby="proof-title" data-nav="/natijalar">
      <div className="container-x">
        <SectionHeading eyebrow={tc("nav.results")} title={<span id="proof-title">{t("title")}</span>} lead={t("lead")} align="split" />

        <Reveal stagger={0.1} className="mt-14 grid gap-3 sm:grid-cols-3">
          {[
            { v: stats.students, l: tc("stats.students"), d: t("statsDesc.students") },
            { v: stats.courses, l: tc("stats.courses"), d: t("statsDesc.courses") },
            { v: stats.projects, l: tc("stats.projects"), d: t("statsDesc.projects") },
          ].map((s) => (
            <div key={s.l} className="glass rounded-(--radius-xl) p-8 sm:p-10">
              <p className="font-display text-5xl font-bold tracking-[-0.04em] sm:text-6xl">
                <Counter value={s.v} />
              </p>
              <p className="t-h4 mt-3">{s.l}</p>
              <p className="mt-1 text-(--fg-muted)">{s.d}</p>
            </div>
          ))}
        </Reveal>

        {compact ? (
          <Link href={routes.results} className="mt-8 inline-flex items-center gap-1 font-semibold text-orange hover:underline">
            {tc("actions.allResults")} <ArrowUpRight size={16} />
          </Link>
        ) : null}

        {hasStories ? (
          <div className="mt-16">
            <Rail ariaLabel={t("railLabel")}>
              {testimonials.map((t) => (
                <article key={t.id} className="flex w-[min(85vw,22rem)] shrink-0 snap-start flex-col rounded-(--radius-lg) border border-(--line) bg-paper p-6">
                  <Quote className="text-orange" size={22} aria-hidden />
                  <p className="t-body mt-4 flex-1">{t.quote}</p>
                  <div className="mt-6 flex items-center gap-3 border-t border-(--line) pt-5">
                    <PlaceholderImage src={t.photo} alt={t.name} className="size-11 shrink-0 rounded-full" sizes="44px" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{t.name}</p>
                      <p className="truncate text-sm text-(--fg-muted)">{t.resultLabel ?? t.role ?? t.course?.title}</p>
                    </div>
                  </div>
                </article>
              ))}
              {results.map((r) => (
                <article key={r.id} className="relative w-[min(85vw,22rem)] shrink-0 snap-start overflow-hidden rounded-(--radius-lg) bg-ink text-white">
                  <PlaceholderImage src={r.image ?? r.afterImage} alt={r.title} className="aspect-[4/3]" sizes="352px" />
                  <div className="p-6">
                    <p className="t-eyebrow text-orange">{tc(`resultKind.${r.kind}`)}</p>
                    <h3 className="t-h4 mt-2">{r.title}</h3>
                    {r.metricLabel ? <p className="font-display mt-3 text-3xl font-bold">{r.metricLabel}</p> : null}
                    <p className="mt-2 text-sm text-white/60">{[r.studentName, r.course?.title].filter(Boolean).join(" · ")}</p>
                  </div>
                </article>
              ))}
            </Rail>
            <Link href={routes.results} className="mt-8 inline-flex items-center gap-1 font-semibold text-orange hover:underline">
              {tc("actions.allResults")} <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  );
}
