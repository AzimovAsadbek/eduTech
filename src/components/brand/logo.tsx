import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND, LOGO } from "./logo-data";
import { lockupPath, logoLayout } from "./logo-svg";

interface MarkProps {
  className?: string;
  /** Colour of the extruded "L": orange on light surfaces, white on dark ones. */
  tone?: "light" | "dark";
  title?: string;
}

/** The "E" mark on its own (favicon, avatars, loaders). */
export function LogoMark({ className, tone = "light", title }: MarkProps) {
  return (
    <svg viewBox={`0 0 ${LOGO.mark.width} ${LOGO.mark.height}`} className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      {title ? <title>{title}</title> : null}
      <path d={LOGO.markE} fill={BRAND.orange} />
      <path d={LOGO.markL} fill={tone === "dark" ? "#FFFFFF" : BRAND.orange} />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  /** Pixel height of the lockup. */
  height?: number;
  tone?: "light" | "dark";
  /** Show the "ZAMONAVIY KASBLAR" tagline (only readable at ≥ 40px). */
  tagline?: boolean;
  href?: string | null;
  label?: string;
  /**
   * Render the static lockup file (/brand/lockup-*.svg) as a lazy <img> instead of inline paths.
   * For placements below the fold (footer): the ~10 KB of path data then stays out of every page's
   * HTML and RSC payload, and the browser caches one file for the whole site.
   */
  asImage?: boolean;
}

/**
 * Full lockup: mark + "DU TECH" (+ optional tagline). Wordmark uses `currentColor`
 * so it inherits charcoal on light surfaces and white on dark ones.
 */
export function Logo({ className, height = 30, tone = "light", tagline = false, href = "/", label = "EduTech — bosh sahifa", asImage = false }: LogoProps) {
  const { viewW, viewH, wordShift } = logoLayout(tagline);
  const width = (viewW / viewH) * height;
  const svg = asImage ? (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG from /public; next/image adds nothing for vector art.
    <img src={lockupPath(tone, tagline)} width={Math.round(width)} height={height} alt="" loading="lazy" decoding="async" className="block" />
  ) : (
    <svg viewBox={`0 0 ${viewW} ${viewH}`} width={width} height={height} className="block" aria-hidden>
      <path d={LOGO.markE} fill={BRAND.orange} />
      <path d={LOGO.markL} fill={tone === "dark" ? "#FFFFFF" : BRAND.orange} />
      <path d={LOGO.wordmark} fill="currentColor" transform={wordShift ? `translate(0 ${wordShift.toFixed(2)})` : undefined} />
      {tagline ? <path d={LOGO.tagline} fill="currentColor" /> : null}
    </svg>
  );
  const classes = cn("inline-flex shrink-0 items-center transition-opacity duration-300 hover:opacity-90", tone === "dark" ? "text-white" : "text-[#3A3A39]", className);
  if (href === null) return <span className={classes}>{svg}</span>;
  return (
    <Link href={href} className={classes} aria-label={label}>
      {svg}
    </Link>
  );
}
