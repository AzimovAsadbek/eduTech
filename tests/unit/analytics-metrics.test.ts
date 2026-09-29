import { describe, expect, it } from "vitest";
import { analyticsWindow, dayKey, placementLabel, rate, windowDays } from "@/server/modules/analytics/metrics";
import { analyticsQuerySchema, rangeFromSearch } from "@/server/modules/analytics/schema";

describe("rate", () => {
  it("is a percentage with one decimal and 0 when the denominator is 0", () => {
    expect(rate(1, 3)).toBe(33.3);
    expect(rate(2, 3)).toBe(66.7);
    expect(rate(3, 8)).toBe(37.5);
    expect(rate(8, 23)).toBe(34.8);
    expect(rate(5, 5)).toBe(100);
    expect(rate(0, 7)).toBe(0);
    expect(rate(4, 0)).toBe(0);
  });
});

describe("analytics window (Asia/Tashkent, UTC+5)", () => {
  it("starts at local midnight N−1 days ago and ends at the end of today", () => {
    const now = new Date("2026-09-15T07:00:00.000Z"); // 12:00 in Tashkent
    expect(analyticsWindow(7, now)).toEqual({ since: new Date("2026-09-08T19:00:00.000Z"), until: new Date("2026-09-15T19:00:00.000Z") });
    expect(analyticsWindow(1, now).since).toEqual(new Date("2026-09-14T19:00:00.000Z"));
  });

  it("uses the local calendar day around UTC midnight", () => {
    // 20:30 UTC on the 15th is already 01:30 on the 16th in Tashkent.
    const lateUtc = new Date("2026-09-15T20:30:00.000Z");
    expect(dayKey(lateUtc)).toBe("2026-09-16");
    expect(analyticsWindow(1, lateUtc)).toEqual({ since: new Date("2026-09-15T19:00:00.000Z"), until: new Date("2026-09-16T19:00:00.000Z") });
    expect(dayKey(new Date("2026-09-15T18:59:59.000Z"))).toBe("2026-09-15");
  });

  it("lists exactly N day keys, oldest first, across month boundaries", () => {
    expect(windowDays(3, new Date("2026-10-01T05:00:00.000Z"))).toEqual(["2026-09-29", "2026-09-30", "2026-10-01"]);
    expect(windowDays(30, new Date("2026-09-15T07:00:00.000Z"))).toHaveLength(30);
  });
});

describe("placementLabel", () => {
  it("labels known Instagram placements, keeps unknown ones and marks untagged traffic", () => {
    expect(placementLabel("story")).toBe("Stories");
    expect(placementLabel("bio")).toBe("Profil havolasi (bio)");
    expect(placementLabel("ads")).toBe("Reklama (target)");
    expect(placementLabel("paid")).toBe("paid");
    expect(placementLabel(null)).toBe("belgilanmagan");
    expect(placementLabel("")).toBe("belgilanmagan");
  });
});

describe("analytics query", () => {
  it("accepts 7, 30 or 90 days and defaults to 30", () => {
    expect(analyticsQuerySchema.parse({ days: "7" })).toEqual({ days: 7 });
    expect(analyticsQuerySchema.parse({})).toEqual({ days: 30 });
    expect(analyticsQuerySchema.safeParse({ days: "14" }).success).toBe(false);
    expect(analyticsQuerySchema.safeParse({ days: "abc" }).success).toBe(false);
  });

  it("falls back to the default range for page search params", () => {
    expect(rangeFromSearch("90")).toBe(90);
    expect(rangeFromSearch(["7", "30"])).toBe(7);
    expect(rangeFromSearch("365")).toBe(30);
    expect(rangeFromSearch(undefined)).toBe(30);
  });
});
