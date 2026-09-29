import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routes } from "@/config/site";
import type { CourseTileData } from "./course-tile-data";

/** Other courses to suggest on a course page: same category first, then featured, then the admin order. */
export function pickRelated(courses: CourseTileData[], current: { id: string; categoryId?: string | null }, limit = 4): CourseTileData[] {
  const rank = (c: CourseTileData) => (current.categoryId && c.category?.id === current.categoryId ? 0 : c.featured ? 1 : 2);
  // Array#sort is stable, so the admin order survives inside each group.
  return courses
    .filter((c) => c.id !== current.id)
    .sort((a, b) => rank(a) - rank(b))
    .slice(0, limit);
}

/**
 * The quiet end of a course page: a compact row of other courses (one row of four on desktop, 2 × 2 on
 * phones), after the application form so it never competes with it. Small tiles in the course-card
 * language (gradient swatch, title, duration and level); server-rendered, no client code.
 */
export async function RelatedCourses({ courses, total }: { courses: CourseTileData[]; total: number }) {
  if (!courses.length) return null;
  const [t, tc] = await Promise.all([getTranslations("courseBody"), getTranslations("common")]);

  return (
    <section aria-labelledby="related-title" className="container-x">
      <div className="border-t border-(--line) py-10 lg:py-12">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="related-title" className="t-eyebrow text-(--fg-muted)">
            {t("otherCourses")}
          </h2>
          <Link href={routes.courses} className="t-meta inline-flex items-center gap-1 text-orange-deep transition-colors hover:text-orange">
            {tc("actions.allCourses")} · {total} <ArrowUpRight size={14} aria-hidden />
          </Link>
        </div>
        <ul className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">
          {courses.map((c) => (
            <li key={c.id} className="min-w-0">
              <Link
                href={routes.course(c.slug)}
                className="group flex items-center gap-3 rounded-(--radius-md) border border-(--line) bg-paper p-2 pr-3 transition-[border-color,box-shadow,transform] duration-300 ease-[var(--ease-out)] hover:-translate-y-px hover:border-orange/40 hover:shadow-sm active:scale-[0.98] sm:p-2.5"
              >
                <span
                  aria-hidden
                  className="font-display grid size-9 shrink-0 place-items-center rounded-[10px] text-sm font-bold text-white sm:size-11 sm:text-base"
                  style={{ background: `linear-gradient(160deg, ${c.accent ?? "#FF6B1A"} 0%, #FF6B1A 60%, #E5560A 100%)` }}
                >
                  {c.title.charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  {/* Phones: two short lines instead of an ellipsis ("Robototexnika", "Sunʼiy intellekt" do not fit one). */}
                  <span className="line-clamp-2 text-sm leading-snug font-semibold break-words sm:line-clamp-1 sm:text-[0.9375rem] sm:leading-tight">{c.title}</span>
                  <span className="t-meta mt-1 block truncate text-(--fg-muted)">
                    {c.durationLabel}
                    <span className="max-sm:hidden"> · {tc(`level.${c.level}`)}</span>
                  </span>
                </span>
                <ArrowUpRight
                  size={16}
                  aria-hidden
                  className="hidden shrink-0 text-orange transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 sm:block"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
