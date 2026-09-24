import { defineRouting } from "next-intl/routing";

export const locales = ["uz", "ru", "en"] as const;
export type Locale = (typeof locales)[number];

export const localeNames: Record<Locale, string> = { uz: "Oʻzbekcha", ru: "Русский", en: "English" };
export const localeShort: Record<Locale, string> = { uz: "UZ", ru: "RU", en: "EN" };
export const ogLocales: Record<Locale, string> = { uz: "uz_UZ", ru: "ru_RU", en: "en_US" };

export const routing = defineRouting({
  locales,
  defaultLocale: "uz",
  // Uzbek lives at the root (/kurslar); other languages are prefixed (/ru/kurslar, /en/kurslar).
  localePrefix: "as-needed",
  localeDetection: false,
});
