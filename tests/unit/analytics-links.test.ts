import { describe, expect, it } from "vitest";
import { buildTaggedUrl, localizedPath, normalizePath, toUtmValue } from "@/components/admin/links/utm";

const ORIGIN = "https://edutech.uz";

describe("toUtmValue", () => {
  it("slugifies to lower-case Latin while keeping underscores", () => {
    expect(toUtmValue("Sentabr qabul")).toBe("sentabr-qabul");
    expect(toUtmValue("IT_Kuz 2026")).toBe("it_kuz-2026");
    expect(toUtmValue("  Oʻquv yili!  ")).toBe("oquv-yili");
    expect(toUtmValue("Осенний набор")).toBe("osenniy-nabor");
    expect(toUtmValue("__a__b__")).toBe("a_b");
    expect(toUtmValue("   ")).toBe("");
  });
});

describe("normalizePath / localizedPath", () => {
  it("cleans free input into a site path", () => {
    expect(normalizePath("media/xizmatlar/")).toBe("/media/xizmatlar");
    expect(normalizePath("/kurslar?utm_source=x#top")).toBe("/kurslar");
    expect(normalizePath("https://edutech.uz/ru/kurslar/ai")).toBe("/kurslar/ai");
    expect(normalizePath("//evil.example//x")).toBe("/evil.example/x");
    expect(normalizePath("")).toBe("/");
    expect(normalizePath("/en")).toBe("/");
  });

  it("adds the language prefix for Russian and English only", () => {
    expect(localizedPath("/kurslar", "uz")).toBe("/kurslar");
    expect(localizedPath("/kurslar", "ru")).toBe("/ru/kurslar");
    expect(localizedPath("/", "en")).toBe("/en");
  });
});

describe("buildTaggedUrl", () => {
  it("builds the ready-made Instagram bio link", () => {
    expect(buildTaggedUrl({ origin: ORIGIN, path: "/ig", locale: "uz", source: "instagram", medium: "bio" })).toBe("https://edutech.uz/ig?utm_source=instagram&utm_medium=bio");
  });

  it("orders the tags, skips empty ones and applies the language", () => {
    expect(buildTaggedUrl({ origin: ORIGIN, path: "/kurslar/dasturlash", locale: "ru", source: "instagram", medium: "story", campaign: "kuz-qabul", content: "video-1" })).toBe(
      "https://edutech.uz/ru/kurslar/dasturlash?utm_source=instagram&utm_medium=story&utm_campaign=kuz-qabul&utm_content=video-1",
    );
    expect(buildTaggedUrl({ origin: ORIGIN, path: "/", locale: "uz", source: "telegram", medium: "", campaign: "yangi_guruh" })).toBe(
      "https://edutech.uz/?utm_source=telegram&utm_campaign=yangi_guruh",
    );
  });
});
