// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cameFromInstagram, captureAttribution, getAttribution, hasSource } from "@/lib/attribution";

const IG_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 390.0.0.20.85";
const SAFARI_UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";

function visit(url: string, { referrer = "", ua = SAFARI_UA }: { referrer?: string; ua?: string } = {}) {
  window.history.replaceState(null, "", url);
  Object.defineProperty(document, "referrer", { value: referrer, configurable: true });
  Object.defineProperty(window.navigator, "userAgent", { value: ua, configurable: true });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  document.cookie = "_fbp=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
});

afterEach(() => {
  vi.useRealTimers();
});

describe("captureAttribution", () => {
  it("starts a session with the UTM touch and keeps it as the 30-day first touch", () => {
    visit("/kurslar?utm_source=instagram&utm_medium=story&utm_campaign=kuz&fbclid=PAZ1", { referrer: "https://l.instagram.com/" });
    const r = captureAttribution();
    expect(r.isNewSession).toBe(true);
    expect(r.touch).toMatchObject({ utmSource: "instagram", utmMedium: "story", utmCampaign: "kuz", fbclid: "PAZ1", landingPath: "/kurslar", referrer: "https://l.instagram.com/" });

    const a = getAttribution();
    expect(a.sessionId).toBe(r.sessionId);
    expect(a.first).toMatchObject({ utmSource: "instagram", utmMedium: "story" });
    expect(a.last).toMatchObject({ utmCampaign: "kuz" });
    expect(a.page).toBe("/kurslar");
  });

  it("keeps the session touch on internal navigation and does not create a new session", () => {
    visit("/?utm_source=instagram&utm_medium=bio");
    const first = captureAttribution();
    visit("/kurslar/dasturlash", { referrer: "http://localhost:3000/" });
    const second = captureAttribution();
    expect(second.isNewSession).toBe(false);
    expect(second.sessionId).toBe(first.sessionId);
    expect(getAttribution().last).toMatchObject({ utmSource: "instagram", utmMedium: "bio", landingPath: "/" });
    expect(getAttribution().page).toBe("/kurslar/dasturlash");
  });

  it("ignores internal referrers and does not overwrite a sourced first touch with a direct one", () => {
    visit("/", { ua: IG_UA });
    captureAttribution();
    sessionStorage.clear();
    visit("/kontakt", { referrer: `${window.location.origin}/` });
    const r = captureAttribution();
    expect(r.touch.referrer).toBeUndefined();
    expect(getAttribution().first).toMatchObject({ inApp: "instagram", landingPath: "/" });
  });

  it("replaces an expired first touch", () => {
    vi.useFakeTimers({ now: new Date("2026-01-01T00:00:00Z") });
    visit("/?utm_source=telegram");
    captureAttribution();
    vi.setSystemTime(new Date("2026-03-01T00:00:00Z"));
    sessionStorage.clear();
    visit("/?utm_source=instagram");
    captureAttribution();
    expect(getAttribution().first).toMatchObject({ utmSource: "instagram" });
  });

  it("applies defaults (Instagram bio page) only to untagged landings", () => {
    visit("/ig");
    expect(captureAttribution({ utmSource: "instagram", utmMedium: "bio" }).touch).toMatchObject({ utmSource: "instagram", utmMedium: "bio" });
    sessionStorage.clear();
    visit("/ig?utm_source=instagram&utm_medium=story");
    expect(captureAttribution({ utmSource: "instagram", utmMedium: "bio" }).touch).toMatchObject({ utmSource: "instagram", utmMedium: "story" });
  });

  it("reads the Meta browser cookie for the lead payload", () => {
    document.cookie = "_fbp=fb.1.1700000000000.123456789";
    visit("/");
    captureAttribution();
    expect(getAttribution().fbp).toBe("fb.1.1700000000000.123456789");
  });
});

describe("cameFromInstagram / hasSource", () => {
  it("detects Instagram via in-app browser, UTM tag or referrer", () => {
    visit("/", { ua: IG_UA });
    captureAttribution();
    expect(cameFromInstagram()).toBe(true);

    sessionStorage.clear();
    visit("/?utm_source=ig");
    captureAttribution();
    expect(cameFromInstagram()).toBe(true);

    sessionStorage.clear();
    visit("/", { referrer: "https://www.instagram.com/" });
    captureAttribution();
    expect(cameFromInstagram()).toBe(true);

    sessionStorage.clear();
    visit("/", { referrer: "https://t.me/" });
    captureAttribution();
    expect(cameFromInstagram()).toBe(false);
  });

  it("treats a touch without any signal as direct", () => {
    expect(hasSource({})).toBe(false);
    expect(hasSource({ referrer: "https://t.me/" })).toBe(true);
    expect(hasSource(null)).toBe(false);
  });
});
