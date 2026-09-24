import type { SiteSettings } from "@/server/modules/settings/service";
import type { Locale } from "./routing";

/** The default city stored in settings, with its spelling in each locale. */
const CITY_NAMES: Record<string, Partial<Record<Locale, string>>> = { Namangan: { ru: "Наманган", en: "Namangan" } };

/**
 * Overlays the translated site-settings fields (`translations.ru` / `translations.en`) on the Uzbek
 * base. Empty translations fall back to the original value; the city name is transliterated when
 * it is one we know so Russian pages don't mix scripts.
 */
export function localizeSettings(settings: SiteSettings, locale: Locale): SiteSettings {
  if (locale === "uz") return settings;
  const t = settings.translations?.[locale] ?? {};
  return {
    ...settings,
    tagline: t.tagline || settings.tagline,
    address: t.address || settings.address,
    workingHours: t.workingHours || settings.workingHours,
    city: CITY_NAMES[settings.city]?.[locale] ?? settings.city,
  };
}
