"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Reveal } from "@/components/motion/reveal";
import { CourseTile } from "@/components/site/course/course-tile";
import type { CourseTileData } from "@/components/site/course/course-tile-data";
import { Chip } from "@/components/ui/chip";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

interface Props {
  courses: CourseTileData[];
  /** Category filters; only categories that actually have courses are shown. */
  categories?: { id: string; slug: string; name: string }[];
  heading?: boolean;
}

/**
 * EXPLORATION: the full catalogue (/kurslar). Every course is its own card (cover, profession,
 * duration / level / format / age, price) with category filters. The homepage uses the
 * server-rendered `CourseTeaser` instead, so it ships no catalogue code.
 */
export function CourseIndex({ courses, categories = [], heading = true }: Props) {
  const t = useTranslations("courseIndex");
  const tc = useTranslations("common");
  const [cat, setCat] = useState<string>("all");
  // After the first filter change the grid remounts per category and its cards replay a short rise.
  const [filtered, setFiltered] = useState(false);

  const visible = useMemo(() => (cat === "all" ? courses : courses.filter((c) => c.category?.slug === cat)), [cat, courses]);
  const usedCats = useMemo(() => categories.filter((c) => courses.some((x) => x.category?.id === c.id)), [categories, courses]);
  const pick = (slug: string) => {
    setCat(slug);
    setFiltered(true);
  };

  return (
    <section className={heading ? "section-y relative" : "relative pb-(--section-y)"} aria-labelledby={heading ? "courses-title" : undefined} aria-label={heading ? undefined : t("filterLabel")} data-nav="/kurslar">
      <div className="container-x">
        {heading ? <SectionHeading eyebrow={tc("nav.courses")} title={<span id="courses-title">{t("title")}</span>} lead={t("lead")} align="split" /> : null}

        {usedCats.length > 1 ? (
          <div
            className={cn("lg:glass flex flex-wrap gap-2 lg:sticky lg:top-20 lg:z-20 lg:-mx-3 lg:w-fit lg:rounded-full lg:px-3 lg:py-2", heading && "mt-10")}
            role="tablist"
            aria-label={t("filterLabel")}
          >
            <Chip as="button" role="tab" aria-selected={cat === "all"} active={cat === "all"} onClick={() => pick("all")}>
              {t("all")}
            </Chip>
            {usedCats.map((c) => (
              <Chip key={c.id} as="button" role="tab" aria-selected={cat === c.slug} active={cat === c.slug} onClick={() => pick(c.slug)}>
                {c.name}
              </Chip>
            ))}
          </div>
        ) : null}

        {/* 1 → 2 → 3 columns. */}
        <Reveal key={filtered ? cat : "initial"} as="ol" stagger={0.06} y={24} className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {visible.map((c, i) => (
            <li
              key={c.id}
              className={filtered ? "motion-safe:animate-[rise-fade_0.5s_var(--ease-out)_backwards]" : undefined}
              style={filtered ? { animationDelay: `${i * 40}ms` } : undefined}
            >
              <CourseTile course={c} n={i + 1} compact={false} />
            </li>
          ))}
        </Reveal>
        {visible.length === 0 ? <p className="py-12 text-center text-(--fg-muted)">{t("empty")}</p> : null}
      </div>
    </section>
  );
}
