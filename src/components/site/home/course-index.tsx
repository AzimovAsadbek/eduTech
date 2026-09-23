"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { gsap, isDesktop, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import { Reveal } from "@/components/motion/reveal";
import { Chip } from "@/components/ui/chip";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { routes } from "@/config/site";
import { pad2 } from "@/lib/utils";
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
 * Rows carry outcome-driven positioning; on desktop a preview card follows the cursor.
 */
export function CourseIndex({ courses, categories, compact, heading = true }: Props) {
  const [cat, setCat] = useState<string>("all");
  const [active, setActive] = useState<string | null>(null);
  const root = useRef<HTMLElement>(null);
  const preview = useRef<HTMLDivElement>(null);

  const visible = useMemo(() => (cat === "all" ? courses : courses.filter((c) => c.category?.slug === cat)), [cat, courses]);
  const usedCats = useMemo(() => categories.filter((c) => courses.some((x) => x.category?.id === c.id)), [categories, courses]);

  useGSAP(
    () => {
      if (!isDesktop() || prefersReducedMotion()) return;
      const el = root.current!;
      const p = preview.current!;
      const xTo = gsap.quickTo(p, "x", { duration: 0.5, ease: "power3" });
      const yTo = gsap.quickTo(p, "y", { duration: 0.5, ease: "power3" });
      const onMove = (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        xTo(e.clientX - r.left + 24);
        yTo(e.clientY - r.top - 120);
      };
      el.addEventListener("mousemove", onMove);
      return () => el.removeEventListener("mousemove", onMove);
    },
    { scope: root },
  );

  const activeCourse = visible.find((c) => c.id === active) ?? null;

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
          {/* Cursor-following preview (desktop) */}
          <div
            ref={preview}
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 z-10 hidden w-64 origin-bottom-left overflow-hidden rounded-(--radius-lg) shadow-lg transition-[opacity,transform] duration-300 ease-[var(--ease-out)] lg:block"
            style={{ opacity: activeCourse ? 1 : 0, transform: activeCourse ? undefined : "scale(.9)" }}
          >
            {activeCourse ? (
              <div className="relative aspect-[4/5]">
                <PlaceholderImage src={activeCourse.coverImage} alt="" className="absolute inset-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="t-eyebrow text-white/70">{activeCourse.roleLabel}</p>
                  <p className="font-display mt-1 text-lg font-semibold">{activeCourse.tagline}</p>
                </div>
              </div>
            ) : null}
          </div>

          <Reveal stagger={0.05} as="ol" className="divide-y divide-(--line) border-y border-(--line)">
            {visible.map((c, i) => (
              <li key={c.id}>
                <Link
                  href={routes.course(c.slug)}
                  onMouseEnter={() => setActive(c.id)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(c.id)}
                  onBlur={() => setActive(null)}
                  data-cursor="view"
                  className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 py-5 transition-colors duration-300 hover:bg-orange-soft/60 sm:grid-cols-[3rem_1.4fr_1fr_auto_auto] sm:gap-6 sm:py-6 lg:grid-cols-[3rem_1.4fr_1fr_8rem_8rem_3rem] lg:px-4"
                  style={{ ["--accent" as string]: c.accent ?? "#FF6B1A" }}
                >
                  <span className="t-meta text-(--fg-muted)">{pad2(i + 1)}</span>
                  <span className="min-w-0">
                    <span className="t-h3 block transition-transform duration-500 ease-[var(--ease-out)] group-hover:translate-x-1">{c.title}</span>
                    <span className="mt-1 block text-sm text-(--fg-muted) sm:hidden">{c.roleLabel} · {c.durationLabel}</span>
                  </span>
                  <span className="hidden text-(--fg-muted) sm:block">
                    <span className="block font-semibold text-(--fg)">{c.roleLabel}</span>
                    <span className="text-sm">{c.tagline}</span>
                  </span>
                  <span className="t-meta hidden text-(--fg-muted) lg:block">{c.durationLabel}</span>
                  <span className="t-meta hidden text-(--fg-muted) sm:block">{compact ? FORMAT[c.format] : LEVEL[c.level]}</span>
                  <span className="grid size-10 place-items-center justify-self-end rounded-full border border-(--line) transition-[background-color,color,transform] duration-300 ease-[var(--ease-out)] group-hover:bg-orange group-hover:text-white group-hover:rotate-45 group-hover:border-orange">
                    <ArrowUpRight size={18} />
                  </span>
                </Link>
              </li>
            ))}
          </Reveal>
          {visible.length === 0 ? <p className="py-12 text-center text-(--fg-muted)">Bu yoʻnalishda hozircha kurs yoʻq.</p> : null}
        </div>
      </div>
    </section>
  );
}
