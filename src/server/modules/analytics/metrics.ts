import { INSTAGRAM_PLACEMENTS } from "@/lib/channels";

/**
 * Pure helpers shared by the analytics service, the admin UI and tests. Client-safe: no server imports.
 */

/** Day buckets and "last N days" follow the business calendar (Namangan), not UTC. */
export const ANALYTICS_TIME_ZONE = "Asia/Tashkent";

/** Shown for traffic whose link carried no utm_medium / utm_campaign. */
export const UNSET_LABEL = "belgilanmagan";

const DAY_MS = 86_400_000;

/** `part / whole` as a percentage rounded to one decimal; 0 when there is nothing to divide by. */
export function rate(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

const wallClockFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: ANALYTICS_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function wallClock(d: Date) {
  const p: Record<string, number> = {};
  for (const part of wallClockFormat.formatToParts(d)) if (part.type !== "literal") p[part.type] = Number(part.value);
  return { year: p.year, month: p.month, day: p.day, hour: p.hour, minute: p.minute, second: p.second };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Calendar day of `d` in the business time zone, "YYYY-MM-DD". */
export function dayKey(d: Date): string {
  const w = wallClock(d);
  return `${w.year}-${pad(w.month)}-${pad(w.day)}`;
}

/**
 * "Last N days" = today plus the N − 1 previous calendar days in the business time zone,
 * so a daily chart has exactly N points and they add up to the totals. `until` is exclusive.
 */
export function analyticsWindow(days: number, now: Date = new Date()): { since: Date; until: Date } {
  const w = wallClock(now);
  const offset = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second) - Math.floor(now.getTime() / 1000) * 1000;
  const todayStart = Date.UTC(w.year, w.month - 1, w.day) - offset;
  return { since: new Date(todayStart - (days - 1) * DAY_MS), until: new Date(todayStart + DAY_MS) };
}

/** The window's day keys, oldest first. */
export function windowDays(days: number, now: Date = new Date()): string[] {
  const [y, m, d] = dayKey(now).split("-").map(Number);
  return Array.from({ length: days }, (_, i) => new Date(Date.UTC(y, m - 1, d - (days - 1 - i))).toISOString().slice(0, 10));
}

const PLACEMENT_LABELS: Record<string, string> = Object.fromEntries(INSTAGRAM_PLACEMENTS.map((p) => [p.value, p.label]));

/** Human label for an Instagram placement (utm_medium); unknown values are shown as they were tagged. */
export function placementLabel(medium: string | null | undefined): string {
  if (!medium) return UNSET_LABEL;
  return PLACEMENT_LABELS[medium] ?? medium;
}
