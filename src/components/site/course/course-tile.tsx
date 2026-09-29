import { Link } from "@/i18n/navigation";
import { ArrowUpRight, Clock, MapPin, Signal, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CourseTileData } from "@/components/site/course/course-tile-data";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { routes } from "@/config/site";
import { cn, pad2 } from "@/lib/utils";

/*
 * Course card pieces shared by the server-rendered homepage teaser and the client-side catalogue (/kurslar).
 * No hooks besides translations, so they render on the server wherever possible.
 */

/** Course card. `compact` trims it on phones to cover, number, profession, title and duration. */
export function CourseTile({ course: c, n, compact }: { course: CourseTileData; n: number; compact: boolean }) {
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
          <PlaceholderImage
            src={c.coverImage}
            alt=""
            className={coverClass}
            sizes={compact ? "(min-width:1024px) 33vw, 50vw" : "(min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw"}
          />
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
              compact
                ? "text-[length:clamp(0.875rem,4vw,1.25rem)] leading-[1.1] wrap-break-word max-[370px]:hyphens-auto sm:text-[1.75rem] sm:leading-none"
                : "text-[1.75rem] leading-none",
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
 * Small, quiet link under the homepage grid ("view all courses"), not another card: the grid stays about
 * the courses, and the link reads as the natural next step. The chip shows how many courses are not shown.
 */
export function AllCoursesLink({ more }: { more: number }) {
  const t = useTranslations("courseIndex.allCta");
  const label = t("action");

  return (
    <div className="mt-8 flex justify-center sm:mt-10">
      <Link
        href={routes.courses}
        aria-label={more ? `${label} — ${t("more", { count: more })}` : label}
        className="group border-line-strong bg-paper text-ink hover:border-orange/45 inline-flex h-12 items-center gap-3 rounded-full border py-1.5 pr-1.5 pl-6 text-[15px] font-semibold shadow-sm transition-[transform,border-color,box-shadow] duration-300 ease-[var(--ease-out)] hover:-translate-y-px hover:shadow-md active:translate-y-0"
      >
        <span>{label}</span>
        {more ? (
          <span aria-hidden className="bg-orange-soft text-orange-deep rounded-full px-2 py-0.5 font-mono text-xs font-medium">
            +{more}
          </span>
        ) : null}
        <span
          aria-hidden
          className="bg-orange grid size-9 place-items-center rounded-full text-white transition-transform duration-300 ease-[var(--ease-out)] group-hover:rotate-45"
        >
          <ArrowUpRight size={16} />
        </span>
      </Link>
    </div>
  );
}
