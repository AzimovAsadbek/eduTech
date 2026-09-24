import type { Locale } from "./routing";

type Translations = Partial<Record<Exclude<Locale, "uz">, Record<string, unknown>>>;

/**
 * Overlays a record's stored translations (`translations.ru` / `translations.en`) on top of the
 * Uzbek base fields. Empty translated values fall back to the original, so partial translations are safe.
 */
export function localize<T extends { translations?: unknown }>(row: T, locale: Locale): T {
  if (locale === "uz" || !row.translations || typeof row.translations !== "object") return row;
  const t = (row.translations as Translations)[locale];
  if (!t) return row;
  const out: Record<string, unknown> = { ...row };
  for (const [k, v] of Object.entries(t)) {
    if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    out[k] = v;
  }
  return out as T;
}

export function localizeAll<T extends { translations?: unknown }>(rows: T[], locale: Locale): T[] {
  return locale === "uz" ? rows : rows.map((r) => localize(r, locale));
}
