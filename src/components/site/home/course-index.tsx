"use client";

import { Link } from "@/i18n/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Clock, MapPin, Signal, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
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
  /** Teaser mode: show only the first N courses (featured first) and hide the category filters. */
  limit?: number;
  /** "rail" = one horizontal, swipeable/scrollable row on every screen (homepage); "grid" = everything visible at once (courses page). */
  layout?: "rail" | "grid";
}

/**
 * EXPLORATION: every course is its own block. Desktop shows a card grid (cover, profession, what you
 * will be able to do, duration / level / format / age, price); mobile shows a swipeable card rail.
 */
export function CourseIndex({ courses: allCourses, categories, compact, heading = true, limit, layout = "grid" }: Props) {
  const t = useTranslations("courseIndex");
  const tc = useTranslations("common");
  const [cat, setCat] = useState<string>("all");
  const grid = useRef<HTMLOListElement>(null);
  const rail = useRef<HTMLOListElement>(null);

  const courses = useMemo(
    () => (limit ? [...allCourses].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, limit) : allCourses),
    [allCourses, limit],
  );
  const visible = useMemo(() => (cat === "all" ? courses : courses.filter((c) => c.category?.slug === cat)), [cat, courses]);
  const usedCats = useMemo(() => categories.filter((c) => courses.some((x) => x.category?.id === c.id)), [categories, courses]);

  // Desktop grid: cards rise in with a stagger when the grid enters; re-runs softly when the filter changes.
  useGSAP(
    () => {
      const el = grid.current;
      if (!el || prefersReducedMotion()) return;
      const cards = el.querySelectorAll<HTMLElement>("[data-card]");
      const tween = gsap.fromTo(
        cards,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.06, paused: true, immediateRender: true },
      );
      ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: () => tween.play() });
    },
    { scope: grid, dependencies: [cat] },
  );

  // Mobile rail: cards rise in as the rail enters, then scale with their distance from the viewport centre while swiping.
  useGSAP(
    () => {
      const el = rail.current;
      if (!el || prefersReducedMotion()) return;
      const cards = el.querySelectorAll<HTMLElement>("[data-card]");
      const enter = gsap.fromTo(
        cards,
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.07, paused: true, immediateRender: true },
      );
      ScrollTrigger.create({ trigger: el, start: "top 90%", once: true, onEnter: () => enter.play() });
      const update = () => {
        const mid = el.getBoundingClientRect().left + el.clientWidth / 2;
        cards.forEach((c) => {
          const r = c.getBoundingClientRect();
          const d = Math.min(1, Math.abs(r.left + r.width / 2 - mid) / el.clientWidth);
          gsap.to(c, { scale: 1 - d * 0.06, duration: 0.3, overwrite: "auto" });
        });
      };
      update();
      el.addEventListener("scroll", update, { passive: true });
      return () => el.removeEventListener("scroll", update);
    },
    { scope: rail, dependencies: [cat] },
  );

  const scrollRail = (dir: 1 | -1) => rail.current?.scrollBy({ left: dir * 340, behavior: "smooth" });

  const cover = (c: CourseCard, className: string) =>
    c.coverImage ? (
      <PlaceholderImage src={c.coverImage} alt="" className={className} sizes="(min-width:1024px) 33vw, 74vw" />
    ) : (
      <div
        className={cn("grain", className)}
        style={{ background: `linear-gradient(160deg, ${c.accent ?? "#FF6B1A"} 0%, #FF6B1A 60%, #E5560A 100%)` }}
        aria-hidden
      />
    );

  const meta = (c: CourseCard) =>
    [
      { icon: Clock, label: t("card.duration"), value: c.durationLabel },
      { icon: Signal, label: t("card.level"), value: tc(`level.${c.level}`) },
      { icon: MapPin, label: t("card.format"), value: tc(`format.${c.format}`) },
      c.ageLabel ? { icon: Users, label: t("card.age"), value: c.ageLabel } : null,
    ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[];

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
              <Link href={routes.courses} className="text-orange mt-4 inline-flex items-center gap-1 font-semibold hover:underline">
                {tc("actions.allCourses")} <ArrowUpRight size={16} />
              </Link>
            }
          />
        ) : null}

        {usedCats.length > 1 && !limit && layout === "grid" ? (
          <div
            className="lg:glass mt-10 flex flex-wrap gap-2 lg:sticky lg:top-20 lg:z-20 lg:-mx-3 lg:w-fit lg:rounded-full lg:px-3 lg:py-2"
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

        {/* Rail: one horizontal row (homepage, every screen) */}
        {layout === "rail" ? (
          <div className="mt-8">
            <ol ref={rail} className="snap-rail py-2 lg:gap-5" aria-label={t("swipe")}>
              {visible.map((c, i) => (
                <li key={c.id} data-card className="w-[76vw] max-w-[20rem] will-change-transform lg:w-[19.5rem]">
                  <Link
                    href={routes.course(c.slug)}
                    className="group bg-ink relative block overflow-hidden rounded-(--radius-xl) text-white shadow-md transition-transform duration-300 active:scale-[0.98]"
                  >
                    <div className="relative aspect-[4/4.4]">
                      {cover(c, "absolute inset-0")}
                      <div className="from-ink/90 via-ink/25 absolute inset-0 bg-gradient-to-t to-transparent" aria-hidden />
                      <span className="font-display absolute top-3 right-4 text-[5.5rem] leading-none font-bold text-white/15 select-none" aria-hidden>
                        {pad2(i + 1)}
                      </span>
                      <div className="absolute inset-x-5 bottom-5">
                        <p className="t-eyebrow text-white/70">{c.roleLabel}</p>
                        <h3 className="font-display mt-1.5 text-[1.75rem] leading-none font-semibold tracking-tight">{c.title}</h3>
                        <p className="mt-2 line-clamp-2 text-sm text-white/75">{c.tagline}</p>
                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {meta(c).map((m) => (
                            <span key={m.label} className="t-meta inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
                              <m.icon size={11} /> {m.value}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between px-5 py-4">
                      <span className="text-sm font-semibold">{c.priceLabel ?? t("card.priceOnRequest")}</span>
                      <span className="text-orange inline-flex items-center gap-1 text-sm font-semibold">
                        {tc("actions.more")} <ArrowUpRight size={16} />
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
            <div className="mt-4 hidden justify-end gap-2 lg:flex">
              <button
                type="button"
                onClick={() => scrollRail(-1)}
                aria-label={tc("actions.prev")}
                className="hover:border-orange hover:bg-orange grid size-11 place-items-center rounded-full border border-(--line) transition-colors hover:text-white"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => scrollRail(1)}
                aria-label={tc("actions.next")}
                className="hover:border-orange hover:bg-orange grid size-11 place-items-center rounded-full border border-(--line) transition-colors hover:text-white"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ) : null}

        {/* Grid: everything visible at once (courses page, every screen) */}
        {layout === "grid" ? (
          <ol ref={grid} className={cn("mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5", limit && limit <= 4 ? "lg:grid-cols-2 xl:grid-cols-4" : "lg:grid-cols-3")}>
            {visible.map((c, i) => (
              <li key={c.id} data-card>
                <Link
                  href={routes.course(c.slug)}
                  className="group bg-ink relative block overflow-hidden rounded-(--radius-xl) text-white shadow-md transition-[transform,box-shadow] duration-500 ease-[var(--ease-out)] hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative aspect-[4/4.6]">
                    {cover(c, "absolute inset-0 transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.03]")}
                    <div className="from-ink/90 via-ink/25 absolute inset-0 bg-gradient-to-t to-transparent" aria-hidden />
                    <span className="font-display absolute top-3 right-4 text-[5.5rem] leading-none font-bold text-white/15 select-none" aria-hidden>
                      {pad2(i + 1)}
                    </span>
                    <div className="absolute inset-x-5 bottom-5">
                      <p className="t-eyebrow text-white/70">{c.roleLabel}</p>
                      <h3 className="font-display mt-1.5 text-[1.75rem] leading-none font-semibold tracking-tight">{c.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-white/75">{c.tagline}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {meta(c).map((m) => (
                          <span key={m.label} className="t-meta inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
                            <m.icon size={11} /> {m.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-5 py-4">
                    <span className="text-sm font-semibold">{c.priceLabel ?? t("card.priceOnRequest")}</span>
                    <span className="text-orange inline-flex items-center gap-1 text-sm font-semibold transition-transform duration-300 group-hover:translate-x-0.5">
                      {tc("actions.more")} <ArrowUpRight size={16} />
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        ) : null}
        {visible.length === 0 ? <p className="py-12 text-center text-(--fg-muted)">{t("empty")}</p> : null}
      </div>
    </section>
  );
}
