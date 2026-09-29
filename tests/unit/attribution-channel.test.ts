import { describe, expect, it } from "vitest";
import { classifyChannel, detectDevice, detectInApp, fbcFromClickId, isBot, referrerHost } from "@/server/modules/attribution/channel";

const IG_IOS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 390.0.0.20.85 (iPhone15,2; iOS 18_5; uz_UZ; uz; scale=3.00; 1179x2556; 734012345)";
const IG_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; SM-A546E Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/128.0.6613.127 Mobile Safari/537.36 Instagram 347.0.0.36.89 Android (34/14; 450dpi; 1080x2340; samsung; SM-A546E; a54x; s5e8835; ru_RU; 634123456)";
const FB_IOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/460.0.0.46.107;FBBV/590000000]";
const SAFARI_IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
const CHROME_DESKTOP = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
const IPAD = "Mozilla/5.0 (iPad; CPU OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1";
const ANDROID_TABLET = "Mozilla/5.0 (Linux; Android 13; SM-X200) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

describe("classifyChannel", () => {
  it("trusts explicit utm_source first, including Meta's dynamic {{site_source_name}} values", () => {
    expect(classifyChannel({ utmSource: "instagram" })).toBe("INSTAGRAM");
    expect(classifyChannel({ utmSource: "IG" })).toBe("INSTAGRAM");
    expect(classifyChannel({ utmSource: "instagram_stories" })).toBe("INSTAGRAM");
    expect(classifyChannel({ utmSource: "fb" })).toBe("FACEBOOK");
    expect(classifyChannel({ utmSource: "an" })).toBe("FACEBOOK");
    expect(classifyChannel({ utmSource: "telegram" })).toBe("TELEGRAM");
    expect(classifyChannel({ utmSource: "tg" })).toBe("TELEGRAM");
    expect(classifyChannel({ utmSource: "google" })).toBe("GOOGLE");
    expect(classifyChannel({ utmSource: "yandex_direct" })).toBe("YANDEX");
    expect(classifyChannel({ utmSource: "youtube" })).toBe("YOUTUBE");
    expect(classifyChannel({ utmSource: "newsletter" })).toBe("OTHER");
    // utm wins over a conflicting referrer / in-app browser
    expect(classifyChannel({ utmSource: "telegram", referrer: "https://l.instagram.com/", userAgent: IG_IOS })).toBe("TELEGRAM");
  });

  it("recognises the Instagram and Facebook in-app browsers even without a referrer", () => {
    expect(classifyChannel({ userAgent: IG_IOS })).toBe("INSTAGRAM");
    expect(classifyChannel({ userAgent: IG_ANDROID })).toBe("INSTAGRAM");
    expect(classifyChannel({ userAgent: FB_IOS })).toBe("FACEBOOK");
    expect(classifyChannel({ inApp: "instagram" })).toBe("INSTAGRAM");
  });

  it("maps referrer hosts and android-app referrers", () => {
    expect(classifyChannel({ referrer: "https://l.instagram.com/?u=https%3A%2F%2Fedutech.uz" })).toBe("INSTAGRAM");
    expect(classifyChannel({ referrer: "https://www.instagram.com/" })).toBe("INSTAGRAM");
    expect(classifyChannel({ referrer: "https://lm.facebook.com/" })).toBe("FACEBOOK");
    expect(classifyChannel({ referrer: "https://t.me/" })).toBe("TELEGRAM");
    expect(classifyChannel({ referrer: "https://www.google.co.uz/" })).toBe("GOOGLE");
    expect(classifyChannel({ referrer: "https://yandex.uz/search/?text=kurslar" })).toBe("YANDEX");
    expect(classifyChannel({ referrer: "https://m.youtube.com/" })).toBe("YOUTUBE");
    expect(classifyChannel({ referrer: "android-app://com.instagram.android/" })).toBe("INSTAGRAM");
    expect(classifyChannel({ referrer: "android-app://org.telegram.messenger/" })).toBe("TELEGRAM");
    expect(classifyChannel({ referrer: "https://kun.uz/news/1" })).toBe("REFERRAL");
  });

  it("ignores internal referrers and falls back to fbclid, then DIRECT", () => {
    expect(classifyChannel({ referrer: "https://edutech.uz/kurslar", siteHost: "edutech.uz" })).toBe("DIRECT");
    expect(classifyChannel({ referrer: "https://www.edutech.uz/", siteHost: "edutech.uz" })).toBe("DIRECT");
    expect(classifyChannel({ fbclid: "IwAR0abc" })).toBe("FACEBOOK");
    expect(classifyChannel({ userAgent: SAFARI_IPHONE })).toBe("DIRECT");
    expect(classifyChannel({})).toBe("DIRECT");
    expect(classifyChannel({ referrer: "not a url" })).toBe("DIRECT");
  });
});

describe("user agent helpers", () => {
  it("detects in-app browsers", () => {
    expect(detectInApp(IG_IOS)).toBe("instagram");
    expect(detectInApp(FB_IOS)).toBe("facebook");
    expect(detectInApp(SAFARI_IPHONE)).toBeNull();
    expect(detectInApp(null)).toBeNull();
  });

  it("detects device class", () => {
    expect(detectDevice(IG_ANDROID)).toBe("mobile");
    expect(detectDevice(SAFARI_IPHONE)).toBe("mobile");
    expect(detectDevice(IPAD)).toBe("tablet");
    expect(detectDevice(ANDROID_TABLET)).toBe("tablet");
    expect(detectDevice(CHROME_DESKTOP)).toBe("desktop");
  });

  it("flags crawlers, link-preview fetchers and headless browsers as bots", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(isBot("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)")).toBe(true);
    expect(isBot("TelegramBot (like TwitterBot)")).toBe(true);
    expect(isBot("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/128.0 Safari/537.36")).toBe(true);
    expect(isBot(null)).toBe(true);
    expect(isBot(IG_IOS)).toBe(false);
    expect(isBot(CHROME_DESKTOP)).toBe(false);
  });

  it("extracts referrer hosts and builds Meta fbc values", () => {
    expect(referrerHost("https://www.google.com/search?q=x")).toBe("google.com");
    expect(referrerHost("android-app://com.instagram.android/")).toBe("com.instagram.android");
    expect(referrerHost("")).toBeNull();
    expect(fbcFromClickId("IwAR0abc", 1_700_000_000_123.9)).toBe("fb.1.1700000000123.IwAR0abc");
  });
});
