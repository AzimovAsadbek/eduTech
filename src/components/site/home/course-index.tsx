"use client";

import { Link } from "@/i18n/navigation";
import { ArrowUpRight, Clock, MapPin, Signal, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useRef, useState } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/components/motion/gsap";
import { Chip } from "@/components/ui/chip";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { routes } from "@/config/site";
import { cn, pad2 } from "@/lib/utils";
import type { CourseCard } from "@/server/modules/content/public";

interface Props {
  courses: CourseCard[];
  /** Category filters for the full catalogue; only categories that actually have courses are shown. */
  categories?: { id: string; slug: string; name: string }[];
  heading?: boolean;
  /**
   * Homepage teaser: only the first N courses (featured first, then admin order), compact cards on phones
   * and a closing "all courses" card in place of the category filters.
   */
  limit?: number;
}

/**
 * EXPLORATION: every course is its own card (cover, profession, what you will be able to do,
 * duration / level / format / age, price). The courses page shows the full grid with category filters;
 * the homepage shows a short grid that ends in a card leading to the full catalogue.
 */
export function CourseIndex({ courses: allCourses, categories = [], heading = true, limit }: Props) {
  const t = useTranslations("courseIndex");
  const tc = useTranslations("common");
  const [cat, setCat] = useState<string>("all");
  const grid = useRef<HTMLOListElement>(null);
  const teaser = Boolean(limit);

  // Array#sort is stable, so the loader's admin order survives inside the featured / regular groups.
  const courses = useMemo(
    () => (limit ? [...allCourses].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, limit) : allCourses),
    [allCourses, limit],
  );
  const rest = useMemo(() => (limit ? allCourses.filter((c) => !courses.includes(c)) : []), [allCourses, courses, limit]);
  const visible = useMemo(() => (cat === "all" ? courses : courses.filter((c) => c.category?.slug === cat)), [cat, courses]);
  const usedCats = useMemo(() => categories.filter((c) => courses.some((x) => x.category?.id === c.id)), [categories, courses]);

  // Cards rise in with a stagger when the grid enters; re-runs softly when the filter changes.
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

        {usedCats.length > 1 && !teaser ? (
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

        {/* Teaser: 2 columns from phones up (compact cards below `sm`), 3 on desktop. Catalogue: 1 → 2 → 3. */}
        <ol ref={grid} className={cn("mt-8 grid lg:grid-cols-3", teaser ? "grid-cols-2 gap-3 sm:gap-5" : "gap-4 sm:grid-cols-2 sm:gap-5")}>
          {visible.map((c, i) => (
            <li key={c.id} data-card>
              <CourseTile course={c} n={i + 1} compact={teaser} />
            </li>
          ))}
          {teaser && courses.length ? (
            <li data-card>
              <AllCoursesTile total={allCourses.length} rest={rest} />
            </li>
          ) : null}
        </ol>
        {visible.length === 0 ? <p className="py-12 text-center text-(--fg-muted)">{t("empty")}</p> : null}
      </div>
    </section>
  );
}

/** Course card. `compact` trims it on phones to cover, number, profession, title and duration. */
function CourseTile({ course: c, n, compact }: { course: CourseCard; n: number; compact: boolean }) {
  const t = useTranslations("courseIndex");
  const tc = useTranslations("common");
  const meta = [
    { icon: Clock, label: t("card.duration"), value: c.durationLabel },
    { icon: Signal, label: t("card.level"), value: tc(`level.${c.level}`) },
    { icon: MapPin, label: t("card.format"), value: tc(`format.${c.format}`) },
    c.ageLabel ? { icon: Users, label: t("card.age"), value: c.ageLabel } : null,
  ].filter(Boolean) as { icon: typeof Clock; label: string; value: string }[];
  const coverClass = "absolute inset-0 transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.03]";

  return (
    <Link
      href={routes.course(c.slug)}
      className="group bg-ink relative block h-full overflow-hidden rounded-(--radius-xl) text-white shadow-md transition-[transform,box-shadow] duration-500 ease-[var(--ease-out)] hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
    >
      <div className={cn("relative", compact ? "aspect-[4/5] sm:aspect-[4/4.6]" : "aspect-[4/4.6]")}>
        {c.coverImage ? (
          <PlaceholderImage src={c.coverImage} alt="" className={coverClass} sizes={compact ? "(min-width:1024px) 33vw, 50vw" : "(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"} />
        ) : (
          <div
            className={cn("grain", coverClass)}
            style={{ background: `linear-gradient(160deg, ${c.accent ?? "#FF6B1A"} 0%, #FF6B1A 60%, #E5560A 100%)` }}
            aria-hidden
          />
        )}
        <div className="from-ink/90 via-ink/25 absolute inset-0 bg-gradient-to-t to-transparent" aria-hidden />
        <span
          className={cn(
            "font-display absolute leading-none font-bold text-white/15 select-none",
            compact ? "top-2 right-3 text-[3.25rem] sm:top-3 sm:right-4 sm:text-[5.5rem]" : "top-3 right-4 text-[5.5rem]",
          )}
          aria-hidden
        >
          {pad2(n)}
        </span>
        <div className={cn("absolute", compact ? "inset-x-3 bottom-3 sm:inset-x-5 sm:bottom-5" : "inset-x-5 bottom-5")}>
          <p className={cn("t-eyebrow text-white/70", compact && "truncate max-sm:text-[0.625rem] max-sm:tracking-[0.1em]")}>{c.roleLabel}</p>
          <h3
            className={cn(
              "font-display mt-1.5 font-semibold tracking-tight",
              compact ? "text-[length:clamp(0.875rem,4vw,1.25rem)] leading-[1.1] wrap-break-word max-[370px]:hyphens-auto sm:text-[1.75rem] sm:leading-none" : "text-[1.75rem] leading-none",
            )}
          >
            {c.title}
          </h3>
          <p className={cn("mt-2 text-sm text-white/75", compact ? "hidden sm:line-clamp-2" : "line-clamp-2")}>{c.tagline}</p>
          {compact ? (
            <span className="t-meta mt-2.5 inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 backdrop-blur sm:hidden">
              <Clock size={11} aria-hidden /> {c.durationLabel}
            </span>
          ) : null}
          <div className={cn("mt-4 flex-wrap gap-1.5", compact ? "hidden sm:flex" : "flex")}>
            {meta.map((m) => (
              <span key={m.label} className="t-meta inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
                <m.icon size={11} /> {m.value}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className={cn("items-center justify-between px-5 py-4", compact ? "hidden sm:flex" : "flex")}>
        <span className="text-sm font-semibold">{c.priceLabel ?? t("card.priceOnRequest")}</span>
        <span className="text-orange inline-flex items-center gap-1 text-sm font-semibold transition-transform duration-300 group-hover:translate-x-0.5">
          {tc("actions.more")} <ArrowUpRight size={16} />
        </span>
      </div>
    </Link>
  );
}

/**
 * Closing card of the homepage grid: same footprint as a course card, but a light outlined surface with a
 * round arrow so it reads as an action, not as another course. Shows how many courses are still to discover.
 */
function AllCoursesTile({ total, rest }: { total: number; rest: CourseCard[] }) {
  const t = useTranslations("courseIndex.allCta");
  const tc = useTranslations("common.actions");
  const more = rest.length;
  const title = tc("allCourses");

  return (
    <Link
      href={routes.courses}
      aria-label={`${title} — ${t("more", { count: more })}`}
      className="group border-orange/25 bg-orange-soft text-ink hover:border-orange/70 relative flex h-full flex-col overflow-hidden rounded-(--radius-xl) border shadow-sm transition-[transform,box-shadow,border-color] duration-500 ease-[var(--ease-out)] hover:-translate-y-1 hover:shadow-lg active:scale-[0.98]"
    >
      <div className="relative aspect-[4/5] sm:aspect-[4/4.6]">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-1/4 -right-1/4 size-[90%] rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.32),transparent)] blur-2xl transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-125"
        />
        {more ? (
          <span aria-hidden className="font-display text-orange/25 absolute top-2 right-3 text-[3.25rem] leading-none font-bold select-none sm:top-3 sm:right-4 sm:text-[5.5rem]">
            +{more}
          </span>
        ) : null}
        <span
          aria-hidden
          className="bg-orange absolute top-3 left-3 grid size-10 place-items-center rounded-full text-white shadow-[0_10px_24px_-10px_rgba(255,107,26,.9)] transition-transform duration-500 ease-[var(--ease-out)] group-hover:rotate-45 sm:top-5 sm:left-5 sm:size-14"
        >
          <ArrowUpRight className="size-5 sm:size-6" />
        </span>
        <div className="absolute inset-x-3 bottom-3 sm:inset-x-5 sm:bottom-5">
          <p className="font-display text-[length:clamp(0.875rem,4vw,1.25rem)] leading-[1.1] font-semibold tracking-tight sm:text-[1.75rem] sm:leading-none">{title}</p>
          <p className="text-orange-deep mt-1.5 text-sm font-semibold sm:mt-2.5">{t("more", { count: more })}</p>
          {more ? <p className="text-ink/65 mt-3 hidden text-sm sm:line-clamp-2">{rest.map((c) => c.title).join(" · ")}</p> : null}
        </div>
      </div>
      <div className="border-orange/15 hidden items-center justify-between border-t px-5 py-4 sm:flex">
        <span className="text-sm font-semibold">{t("total", { count: total })}</span>
        <span className="text-orange-deep inline-flex items-center gap-1 text-sm font-semibold transition-transform duration-300 group-hover:translate-x-0.5">
          {t("action")} <ArrowUpRight size={16} />
        </span>
      </div>
    </Link>
  );
}
