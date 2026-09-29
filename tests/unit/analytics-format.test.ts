import { describe, expect, it } from "vitest";
import { describeUserAgent, formatCount, formatDayKey, formatMinutes, formatPercent, formatRate } from "@/components/admin/analytics/format";

describe("number formatting", () => {
  it("groups thousands and uses the Uzbek decimal comma", () => {
    expect(formatCount(12345)).toBe("12 345");
    expect(formatCount(999)).toBe("999");
    expect(formatPercent(37.5)).toBe("37,5%");
    expect(formatPercent(40)).toBe("40%");
    expect(formatPercent(2925)).toBe(">100%");
    expect(formatRate(12.5, 0)).toBe("—");
    expect(formatRate(12.5, 8)).toBe("12,5%");
    expect(formatDayKey("2026-09-05")).toBe("05.09");
  });

  it("formats median response times compactly", () => {
    expect(formatMinutes(null)).toBe("—");
    expect(formatMinutes(0.4)).toBe("<1 daq");
    expect(formatMinutes(12.4)).toBe("12 daq");
    expect(formatMinutes(90)).toBe("1,5 soat");
    expect(formatMinutes(180)).toBe("3 soat");
    expect(formatMinutes(3024)).toBe("2,1 kun");
  });
});

describe("describeUserAgent", () => {
  it("names the device and the in-app browser or regular browser", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 390.0.0.20.85 (iPhone15,2; iOS 18_5; uz_UZ; uz; scale=3.00; 1179x2556; 734012345)",
      ),
    ).toBe("iPhone · Instagram ilovasi");
    expect(
      describeUserAgent("Mozilla/5.0 (Linux; Android 13; Redmi Note 12) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Mobile Safari/537.36 Telegram-Android/11.2.3"),
    ).toBe("Android · Telegram ilovasi");
    expect(describeUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0")).toBe(
      "Windows · Edge",
    );
    expect(describeUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15")).toBe("Mac · Safari");
    expect(describeUserAgent(null)).toBeNull();
  });
});
