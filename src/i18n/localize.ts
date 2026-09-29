import type { Locale } from "./routing";

type Translations = Partial<Record<Exclude<Locale, "uz">, Record<string, unknown>>>;

/**
 * Overlays a record's stored translations (`translations.ru` / `translations.en`) on top of the
 * Uzbek base fields. Empty translated values fall back to the original, so partial translations are safe.
 *
 * The `translations` column itself is always dropped from the result, for every locale: once a row is
 * localised nothing needs the other languages, and leaving them in would ship every translation of every
 * row to the browser whenever a localised row is passed to a client component.
 */
export function localize<T extends { translations?: unknown }>(row: T, locale: Locale): T {
  const { translations, ...base } = row;
  const t = locale !== "uz" && translations && typeof translations === "object" ? (translations as Translations)[locale] : undefined;
  if (!t) return base as T;
  const out: Record<string, unknown> = base;
  for (const [k, v] of Object.entries(t)) {
    if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    out[k] = v;
  }
  return out as T;
}

export function localizeAll<T extends { translations?: unknown }>(rows: T[], locale: Locale): T[] {
  return rows.map((r) => localize(r, locale));
}
