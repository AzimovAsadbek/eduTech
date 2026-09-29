import { z } from "zod";

export const ANALYTICS_RANGES = [7, 30, 90] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];
export const DEFAULT_ANALYTICS_RANGE: AnalyticsRange = 30;

/** GET /api/v1/admin/analytics/channels?days=7|30|90 */
export const analyticsQuerySchema = z.object({
  days: z
    .enum(["7", "30", "90"], { error: "days 7, 30 yoki 90 boʻlishi kerak" })
    .default("30")
    .transform((v) => Number(v) as AnalyticsRange),
});

/** Lenient variant for page search params: anything unexpected falls back to the default range. */
export function rangeFromSearch(value: string | string[] | undefined): AnalyticsRange {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (ANALYTICS_RANGES as readonly number[]).includes(n) ? (n as AnalyticsRange) : DEFAULT_ANALYTICS_RANGE;
}
