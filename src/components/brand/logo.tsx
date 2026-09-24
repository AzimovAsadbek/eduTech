import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND, LOGO } from "./logo-data";

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
}

/**
 * Full lockup: mark + "DU TECH" (+ optional tagline). Wordmark uses `currentColor`
 * so it inherits charcoal on light surfaces and white on dark ones.
 */
export function Logo({ className, height = 30, tone = "light", tagline = false, href = "/", label = "EduTech — bosh sahifa" }: LogoProps) {
  // Without the tagline the wordmark is centred on the mark's height instead of sitting on its top edge.
  const viewH = tagline ? LOGO.height : LOGO.mark.height + 1.8;
  const wordShift = tagline ? 0 : (LOGO.mark.height - 52.5) / 2;
  const width = (LOGO.width / viewH) * height;
  const svg = (
    <svg viewBox={`0 0 ${LOGO.width} ${viewH}`} width={width} height={height} className="block" aria-hidden>
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
