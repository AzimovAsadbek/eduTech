"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, isDesktop, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/components/motion/gsap";
import { Chip } from "@/components/ui/chip";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { routes } from "@/config/site";
import { cn, pad2 } from "@/lib/utils";
import type { CourseCard } from "@/server/modules/content/public";

const LEVEL: Record<string, string> = { BEGINNER: "Boshlangʻich", INTERMEDIATE: "Oʻrta", ADVANCED: "Yuqori" };
const FORMAT: Record<string, string> = { OFFLINE: "Offlayn", ONLINE: "Onlayn", HYBRID: "Gibrid" };

interface Props {
  courses: CourseCard[];
  categories: { id: string; slug: string; name: string }[];
  compact?: boolean;
  heading?: boolean;
}

/**
 * EXPLORATION: courses as an editorial index (not a card grid).
 * Rows slide in once on scroll; on desktop a preview card follows the cursor (GSAP-only transforms, no CSS transition conflicts).
 */
export function CourseIndex({ courses, categories, compact, heading = true }: Props) {
  const [cat, setCat] = useState<string>("all");
  const [active, setActive] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const preview = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => (cat === "all" ? courses : courses.filter((c) => c.category?.slug === cat)), [cat, courses]);
  const usedCats = useMemo(() => categories.filter((c) => courses.some((x) => x.category?.id === c.id)), [categories, courses]);

  // Rows: a single, quick entrance when the list scrolls into view; re-run softly when the filter changes.
  useGSAP(
    () => {
      const el = list.current;
      if (!el || prefersReducedMotion()) return;
      const rows = el.querySelectorAll<HTMLElement>("[data-row]");
      const tween = gsap.fromTo(rows, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, ease: "expo.out", stagger: 0.04, paused: true, immediateRender: true });
      ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => tween.play() });
    },
    { scope: list, dependencies: [cat] },
  );

  // Preview card: follows the cursor on desktop.
  useGSAP(
    () => {
      if (!isDesktop() || prefersReducedMotion()) return;
      const el = root.current!;
      const p = preview.current!;
      gsap.set(p, { xPercent: 4, yPercent: -50, opacity: 0, scale: 0.92 });
      const xTo = gsap.quickTo(p, "x", { duration: 0.45, ease: "power3" });
      const yTo = gsap.quickTo(p, "y", { duration: 0.45, ease: "power3" });
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        xTo(e.clientX - r.left + 24);
        yTo(e.clientY - r.top);
      };
      el.addEventListener("mousemove", onMove);
      return () => el.removeEventListener("mousemove", onMove);
    },
    { scope: root },
  );

  useEffect(() => {
    const p = preview.current;
    if (!p || !isDesktop() || prefersReducedMotion()) return;
    gsap.to(p, { opacity: active ? 1 : 0, scale: active ? 1 : 0.92, duration: 0.35, ease: "power3.out", overwrite: "auto" });
  }, [active]);

  const activeCourse = courses.find((c) => c.id === active) ?? null;

  return (
    <section ref={root} className="section-y relative" aria-labelledby="courses-title">
      <div className="container-x">
        {heading ? (
          <SectionHeading
            eyebrow="Kurslar"
            title={<span id="courses-title">Qaysi kasbni tanlaysiz?</span>}
            lead="Har bir kurs bitta savolga javob beradi: tugatganingizdan keyin nima qila olasiz?"
            align="split"
            aside={
              <Link href={routes.courses} className="mt-4 inline-flex items-center gap-1 font-semibold text-orange hover:underline">
                Barcha kurslar <ArrowUpRight size={16} />
              </Link>
            }
          />
        ) : null}

        {usedCats.length > 1 ? (
          <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Kurs yoʻnalishlari">
            <Chip as="button" role="tab" aria-selected={cat === "all"} active={cat === "all"} onClick={() => setCat("all")}>
              Barchasi
            </Chip>
            {usedCats.map((c) => (
              <Chip key={c.id} as="button" role="tab" aria-selected={cat === c.slug} active={cat === c.slug} onClick={() => setCat(c.slug)}>
                {c.name}
              </Chip>
            ))}
          </div>
        ) : null}

        <div className="relative mt-8">
          {/* Cursor-following preview (desktop only) */}
          <div ref={preview} aria-hidden className="pointer-events-none absolute top-0 left-0 z-10 hidden w-60 overflow-hidden rounded-(--radius-lg) shadow-lg will-change-transform lg:block">
            {activeCourse ? (
              <div className="relative aspect-[4/5]">
                <PlaceholderImage src={activeCourse.coverImage} alt="" className="absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute right-4 bottom-4 left-4 text-white">
                  <p className="t-eyebrow text-white/70">{activeCourse.roleLabel}</p>
                  <p className="font-display mt-1 text-lg font-semibold">{activeCourse.tagline}</p>
                </div>
              </div>
            ) : null}
          </div>

          <ol ref={list} className="divide-y divide-(--line) border-y border-(--line)">
            {visible.map((c, i) => (
              <li key={c.id} data-row>
                <Link
                  href={routes.course(c.slug)}
                  onMouseEnter={() => setActive(c.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(c.id)}
                  onBlur={() => setActive(null)}
                  data-cursor="view"
                  className="group grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-4 transition-colors duration-300 hover:bg-orange-soft/60 sm:grid-cols-[3rem_1.4fr_1fr_auto_auto] sm:gap-6 sm:py-6 lg:grid-cols-[3rem_1.4fr_1fr_8rem_8rem_3rem] lg:px-4"
                >
                  <span className="t-meta text-(--fg-muted)">{pad2(i + 1)}</span>
                  <span className="min-w-0">
                    <span className={cn("block font-display text-xl font-semibold tracking-tight transition-transform duration-500 ease-[var(--ease-out)] group-hover:translate-x-1 sm:text-2xl")}>{c.title}</span>
                    <span className="mt-0.5 block text-sm text-(--fg-muted) sm:hidden">
                      {c.roleLabel} · {c.durationLabel}
                    </span>
                  </span>
                  <span className="hidden text-(--fg-muted) sm:block">
                    <span className="block font-semibold text-(--fg)">{c.roleLabel}</span>
                    <span className="text-sm">{c.tagline}</span>
                  </span>
                  <span className="t-meta hidden text-(--fg-muted) lg:block">{c.durationLabel}</span>
                  <span className="t-meta hidden text-right text-(--fg-muted) sm:block">{compact ? FORMAT[c.format] : LEVEL[c.level]}</span>
                  <span className="grid size-9 place-items-center justify-self-end rounded-full border border-(--line) transition-[background-color,color,transform,border-color] duration-300 ease-[var(--ease-out)] group-hover:rotate-45 group-hover:border-orange group-hover:bg-orange group-hover:text-white sm:size-10">
                    <ArrowUpRight size={18} />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
          {visible.length === 0 ? <p className="py-12 text-center text-(--fg-muted)">Bu yoʻnalishda hozircha kurs yoʻq.</p> : null}
        </div>
      </div>
    </section>
  );
}
