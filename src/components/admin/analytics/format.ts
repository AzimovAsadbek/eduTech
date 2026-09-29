import { detectInApp } from "@/lib/user-agent";

/**
 * Deterministic number / duration / user-agent formatting for the analytics UI.
 * Hand-rolled instead of Intl("uz-UZ") because Node and browser ICU disagree on Uzbek output,
 * and several of these strings render in client components (hydration must match).
 */

/** 12345 → "12 345" (narrow no-break space as the thousands separator). */
export function formatCount(n: number): string {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** 37.5 → "37,5%", 40 → "40%" (Uzbek decimal comma). Values above 100 read as ">100%". */
export function formatPercent(value: number): string {
  if (value > 100) return ">100%";
  const fixed = Number.isInteger(value) ? String(value) : value.toFixed(1);
  return `${fixed.replace(".", ",")}%`;
}

/** A rate is only meaningful when its denominator is non-zero; otherwise show a dash. */
export function formatRate(value: number, denominator: number): string {
  return denominator ? formatPercent(value) : "—";
}

const oneDecimal = (n: number) => {
  const r = Math.round(n * 10) / 10;
  return (Number.isInteger(r) ? String(r) : r.toFixed(1)).replace(".", ",");
};

/** Median response time, compact enough for a stat tile: "<1 daq", "12 daq", "1,5 soat", "2,1 kun"; "—" when unknown. */
export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return "—";
  if (minutes < 1) return "<1 daq";
  if (minutes < 59.5) return `${Math.round(minutes)} daq`;
  if (minutes < 1440) return `${oneDecimal(minutes / 60)} soat`;
  return `${oneDecimal(minutes / 1440)} kun`;
}

/** "2026-09-29" → "29.09" without going through Date/Intl (no time-zone or ICU surprises). */
export function formatDayKey(key: string): string {
  const [, m, d] = key.split("-");
  return `${d}.${m}`;
}

const IN_APP_LABELS = { instagram: "Instagram ilovasi", facebook: "Facebook ilovasi", telegram: "Telegram ilovasi" } as const;

const BROWSERS: [RegExp, string][] = [
  [/YaBrowser/i, "Yandex Browser"],
  [/SamsungBrowser/i, "Samsung Internet"],
  [/Edg(A|iOS|e)?\//, "Edge"],
  [/OPR\/|Opera/i, "Opera"],
  [/Firefox|FxiOS/i, "Firefox"],
  [/Chrome|CriOS/i, "Chrome"],
  [/Safari/i, "Safari"],
];

/** Short device + app description from a user agent, e.g. "iPhone · Instagram ilovasi", "Windows · Chrome". */
export function describeUserAgent(userAgent: string | null | undefined): string | null {
  if (!userAgent) return null;
  const device = /iPhone|iPod/.test(userAgent)
    ? "iPhone"
    : /iPad/.test(userAgent)
      ? "iPad"
      : /Android/i.test(userAgent)
        ? /Mobile/i.test(userAgent)
          ? "Android"
          : "Android planshet"
        : /Windows/i.test(userAgent)
          ? "Windows"
          : /Macintosh|Mac OS X/.test(userAgent)
            ? "Mac"
            : /Linux|CrOS/i.test(userAgent)
              ? "Linux"
              : null;
  const inApp = detectInApp(userAgent);
  const app = inApp ? IN_APP_LABELS[inApp] : (BROWSERS.find(([re]) => re.test(userAgent))?.[1] ?? null);
  const parts = [device, app].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}
