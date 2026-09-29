import { describe, expect, it } from "vitest";
import { localize, localizeAll } from "@/i18n/localize";
import { localizeCourse } from "@/i18n/localize-content";

const row = {
  id: "c1",
  title: "Dasturlash",
  tagline: "Real mahsulotlar yarating.",
  translations: { ru: { title: "Программирование", tagline: "" }, en: { title: "Programming" } },
};

describe("localize", () => {
  it("overlays the requested language and falls back per field", () => {
    expect(localize(row, "ru")).toEqual({ id: "c1", title: "Программирование", tagline: "Real mahsulotlar yarating." });
  });

  it("never passes the stored translations on, for any locale", () => {
    for (const locale of ["uz", "ru", "en"] as const) expect(localize(row, locale)).not.toHaveProperty("translations");
    expect(localizeAll([row], "uz")).toEqual([{ id: "c1", title: "Dasturlash", tagline: "Real mahsulotlar yarating." }]);
  });

  it("does not mutate the cached row", () => {
    localize(row, "en");
    expect(row.translations.en.title).toBe("Programming");
    expect(row.title).toBe("Dasturlash");
  });

  it("localises nested relations too", () => {
    const course = { ...row, category: { id: "k", name: "IT", translations: { en: { name: "Tech" } } } };
    expect(localizeCourse(course, "en")).toEqual({ id: "c1", title: "Programming", tagline: "Real mahsulotlar yarating.", category: { id: "k", name: "Tech" } });
  });
});
