"use client";

import { Link } from "@/i18n/navigation";
import { ArrowUpRight, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, isDesktop, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/components/motion/gsap";
import { Chip } from "@/components/ui/chip";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { routes } from "@/config/site";
import { cn, pad2 } from "@/lib/utils";
import type { CourseCard } from "@/server/modules/content/public";

interface Props {
  courses: CourseCard[];
  categories: { id: string; slug: string; name: string }[];
  compact?: boolean;
  heading?: boolean;
}

/**
 * EXPLORATION: courses as an editorial index (not a card grid).
 * Left: the index rows. Right (desktop): a sticky spotlight panel that shows the hovered course —
 * cover, profession, tagline and outcomes — cross-fading between courses. No cursor-following elements.
 */
export function CourseIndex({ courses, categories, compact, heading = true }: Props) {
  const t = useTranslations("courseIndex");
  const tc = useTranslations("common");
  const [cat, setCat] = useState<string>("all");
  const [activeId, setActiveId] = useState<string | null>(courses[0]?.id ?? null);
  const list = useRef<HTMLOListElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => (cat === "all" ? courses : courses.filter((c) => c.category?.slug === cat)), [cat, courses]);
  const usedCats = useMemo(() => categories.filter((c) => courses.some((x) => x.category?.id === c.id)), [categories, courses]);
  const active = visible.find((c) => c.id === activeId) ?? visible[0] ?? null;

  // Rows: one quick entrance when the list scrolls into view; re-runs softly when the filter changes.
  useGSAP(
    () => {
      const el = list.current;
      if (!el || prefersReducedMotion()) return;
      const rows = el.querySelectorAll<HTMLElement>("[data-row]");
      if (!isDesktop()) {
        rows.forEach((r) => {
          const tw = gsap.fromTo(r, { opacity: 0, x: -14 }, { opacity: 1, x: 0, duration: 0.6, ease: "expo.out", paused: true, immediateRender: true });
          ScrollTrigger.create({ trigger: r, start: "top 94%", once: true, onEnter: () => tw.play() });
        });
        return;
      }
      const tween = gsap.fromTo(rows, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.04, paused: true, immediateRender: true });
      ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => tween.play() });
    },
    { scope: list, dependencies: [cat] },
  );

  // Spotlight: cross-fade its content whenever the active course changes.
  useEffect(() => {
    const el = panel.current;
    if (!el || prefersReducedMotion()) return;
    gsap.fromTo(el.querySelectorAll("[data-anim]"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, ease: "expo.out", stagger: 0.05, overwrite: "auto" });
    gsap.fromTo(el.querySelector("[data-cover]"), { scale: 1.04, opacity: 0.6 }, { scale: 1, opacity: 1, duration: 0.7, ease: "expo.out", overwrite: "auto" });
  }, [active?.id]);

  return (
    <section className="section-y relative" aria-labelledby="courses-title" data-nav="/kurslar">
      <div className="container-x">
        {heading ? (
          <SectionHeading
            eyebrow={tc("nav.courses")}
            title={<span id="courses-title">{t("title")}</span>}
            lead={t("lead")}
            align="split"
            aside={
              <Link href={routes.courses} className="mt-4 inline-flex items-center gap-1 font-semibold text-orange hover:underline">
                {tc("actions.allCourses")} <ArrowUpRight size={16} />
              </Link>
            }
          />
        ) : null}

        {usedCats.length > 1 ? (
          <div
            className="mt-10 flex flex-wrap gap-2 lg:glass lg:sticky lg:top-20 lg:z-20 lg:-mx-2 lg:rounded-full lg:px-3 lg:py-2"
            role="tablist"
            aria-label={t("filterLabel")}
          >
            <Chip as="button" role="tab" aria-selected={cat === "all"} active={cat === "all"} onClick={() => setCat("all")}>
              {t("all")}
            </Chip>
            {usedCats.map((c) => (
              <Chip key={c.id} as="button" role="tab" aria-selected={cat === c.slug} active={cat === c.slug} onClick={() => setCat(c.slug)}>
                {c.name}
              </Chip>
            ))}
          </div>
        ) : null}

        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
          <ol ref={list} className="divide-y divide-(--line) border-y border-(--line) lg:col-span-8">
            {visible.map((c, i) => {
              const isActive = active?.id === c.id;
              return (
                <li key={c.id} data-row>
                  <Link
                    href={routes.course(c.slug)}
                    onMouseEnter={() => setActiveId(c.id)}
                    onFocus={() => setActiveId(c.id)}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "group grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-4 transition-colors duration-300 sm:grid-cols-[2.5rem_1.3fr_1fr_auto_auto] sm:gap-5 sm:py-5 lg:px-4",
                      isActive ? "bg-orange-soft/60" : "hover:bg-orange-soft/40 active:bg-orange-soft/60",
                    )}
                  >
                    <span className={cn("t-meta transition-colors", isActive ? "text-orange" : "text-(--fg-muted)")}>{pad2(i + 1)}</span>
                    <span className="min-w-0">
                      <span className={cn("block font-display text-xl font-semibold tracking-tight transition-transform duration-500 ease-[var(--ease-out)] sm:text-2xl", isActive && "translate-x-1")}>{c.title}</span>
                      <span className="mt-0.5 block text-sm text-(--fg-muted) sm:hidden">
                        {c.roleLabel} · {c.durationLabel}
                      </span>
                    </span>
                    <span className="hidden min-w-0 text-(--fg-muted) sm:block">
                      <span className="block truncate font-semibold text-(--fg)">{c.roleLabel}</span>
                      <span className="block truncate text-sm">{c.tagline}</span>
                    </span>
                    <span className="t-meta hidden text-right text-(--fg-muted) sm:block">{c.durationLabel}</span>
                    <span
                      className={cn(
                        "grid size-9 place-items-center justify-self-end rounded-full border transition-[background-color,color,transform,border-color] duration-300 ease-[var(--ease-out)] sm:size-10",
                        isActive ? "rotate-45 border-orange bg-orange text-white" : "border-(--line)",
                      )}
                    >
                      <ArrowUpRight size={18} />
                    </span>
                  </Link>
                </li>
              );
            })}
            {visible.length === 0 ? <li className="py-12 text-center text-(--fg-muted)">{t("empty")}</li> : null}
          </ol>

          {/* Spotlight (desktop) */}
          <aside className="hidden lg:col-span-4 lg:block" aria-live="polite">
            {active ? (
              <div ref={panel} className="sticky top-28 overflow-hidden rounded-(--radius-xl) border border-(--line) bg-paper shadow-md">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <div data-cover className="absolute inset-0 will-change-transform">
                    {active.coverImage ? (
                      <PlaceholderImage key={active.id} src={active.coverImage} alt={t("coverAlt", { title: active.title })} className="absolute inset-0" sizes="33vw" />
                    ) : (
                      <div className="grain absolute inset-0" style={{ background: `linear-gradient(150deg, ${active.accent ?? "#FF6B1A"} 0%, #FF6B1A 55%, #E5560A 100%)` }} aria-hidden>
                        <span className="font-display absolute -top-4 -right-2 text-[9rem] leading-none font-bold text-white/15 select-none">{pad2(visible.findIndex((c) => c.id === active.id) + 1)}</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" aria-hidden />
                  <div className="absolute right-5 bottom-5 left-5 text-white">
                    <p data-anim className="t-eyebrow text-white/75">
                      {active.roleLabel}
                    </p>
                    <p data-anim className="font-display mt-1 text-2xl font-semibold tracking-tight">
                      {active.tagline}
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <div data-anim className="flex flex-wrap gap-2">
                    <span className="t-meta rounded-full bg-orange-soft px-2.5 py-1 text-ink">{active.durationLabel}</span>
                    <span className="t-meta rounded-full bg-orange-soft px-2.5 py-1 text-ink">{compact ? tc(`format.${active.format}`) : tc(`level.${active.level}`)}</span>
                    {active.ageLabel ? <span className="t-meta rounded-full bg-orange-soft px-2.5 py-1 text-ink">{active.ageLabel}</span> : null}
                  </div>
                  {active.outcomes.length ? (
                    <ul data-anim className="mt-5 space-y-2">
                      {active.outcomes.slice(0, 3).map((o) => (
                        <li key={o} className="flex items-start gap-2.5 text-sm">
                          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-orange text-white">
                            <Check size={12} />
                          </span>
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <Link data-anim href={routes.course(active.slug)} className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 font-semibold text-white transition-colors hover:bg-orange">
                    {tc("actions.aboutCourse")} <ArrowUpRight size={16} />
                  </Link>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </section>
  );
}
