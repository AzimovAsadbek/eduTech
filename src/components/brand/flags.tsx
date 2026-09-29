import { useId, type ReactNode } from "react";
import type { Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export interface FlagProps {
  /** Diameter in CSS pixels. */
  size?: number;
  className?: string;
  /** Accessible name. Without one the flag is decorative and hidden from assistive technology. */
  title?: string;
}

/**
 * Shared round frame: the artwork is drawn on a 64×64 square, cropped to a circle and finished with a
 * hairline inner ring so white bands still read on white surfaces. Inline SVG only — flag emoji do not
 * render on Windows, and nothing is loaded from outside.
 */
function RoundFlag({ size = 20, className, title, children }: FlagProps & { children: ReactNode }) {
  const clip = useId();
  // 2/64 of the diameter at icon sizes, never more than 1px on larger flags.
  const ring = Math.min(2, 64 / size);
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title ? <title>{title}</title> : null}
      <clipPath id={clip}>
        <circle cx="32" cy="32" r="32" />
      </clipPath>
      <g clipPath={`url(#${clip})`}>{children}</g>
      <circle cx="32" cy="32" r={32 - ring / 2} fill="none" stroke="#0b0b0c" strokeOpacity=".16" strokeWidth={ring} />
    </svg>
  );
}

/** Five-point star (outer radius 2.1), drawn relative to its top point. */
const STAR = "l.53 1.37 1.47.08-1.14.93.38 1.42-1.23-.8-1.23.8.38-1.42-1.14-.93 1.47-.08z";
/** The flag has twelve stars in rows of 3·4·5; the same stepped rows of 2·3·4 stay legible at 20px. */
const UZ_STARS = [
  [38.4, 3.5],
  [44, 3.5],
  [32.8, 8.9],
  [38.4, 8.9],
  [44, 8.9],
  [27.2, 14.3],
  [32.8, 14.3],
  [38.4, 14.3],
  [44, 14.3],
]
  .map(([x, y]) => `M${x} ${y}${STAR}`)
  .join("");

/** Uzbekistan: blue, white and green bands with thin red separators, the crescent and the stars. */
export function FlagUz(props: FlagProps) {
  return (
    <RoundFlag {...props}>
      <path fill="#1eb53a" d="M0 0h64v64H0z" />
      <path fill="#0099b5" d="M0 0h64v32H0z" />
      <path fill="#ce1126" d="M0 20.5h64v23H0z" />
      <path fill="#fff" d="M0 22.5h64v19H0z" />
      <circle cx="18.5" cy="11" r="6.6" fill="#fff" />
      <circle cx="21.4" cy="11" r="5.9" fill="#0099b5" />
      <path fill="#fff" d={UZ_STARS} />
    </RoundFlag>
  );
}

/** Russia: white, blue and red. */
export function FlagRu(props: FlagProps) {
  return (
    <RoundFlag {...props}>
      <path fill="#d52b1e" d="M0 0h64v64H0z" />
      <path fill="#0039a6" d="M0 0h64v42.67H0z" />
      <path fill="#fff" d="M0 0h64v21.33H0z" />
    </RoundFlag>
  );
}

/** United Kingdom (Union Jack), squared up for the round crop. */
export function FlagGb(props: FlagProps) {
  const counter = useId();
  return (
    <RoundFlag {...props}>
      {/* Counterchange: the red saltire keeps to one side of the white one, like a pinwheel. */}
      <clipPath id={counter}>
        <path d="M32 32h32v32zv32H0zH0V0zV0h32z" />
      </clipPath>
      <path fill="#012169" d="M0 0h64v64H0z" />
      <path stroke="#fff" strokeWidth="12.8" d="M0 0l64 64M64 0L0 64" />
      <path stroke="#c8102e" strokeWidth="8.5" clipPath={`url(#${counter})`} d="M0 0l64 64M64 0L0 64" />
      <path stroke="#fff" strokeWidth="21.3" d="M32 0v64M0 32h64" />
      <path stroke="#c8102e" strokeWidth="12.8" d="M32 0v64M0 32h64" />
    </RoundFlag>
  );
}

const LOCALE_FLAGS: Record<Locale, (props: FlagProps) => ReactNode> = { uz: FlagUz, ru: FlagRu, en: FlagGb };

/** Round flag for a site language. English is shown with the UK flag. */
export function LocaleFlag({ locale, ...props }: FlagProps & { locale: Locale }) {
  const Flag = LOCALE_FLAGS[locale];
  return <Flag {...props} />;
}
