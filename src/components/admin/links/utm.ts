import { slugify } from "@/lib/utils";

/**
 * Tagged-link helpers for the admin link builder. Pure and client-safe.
 * Uzbek pages live at the root (/kurslar); Russian and English are prefixed (/ru/kurslar, /en/kurslar).
 */

export type LinkLocale = "uz" | "ru" | "en";

export const LINK_LOCALES: { value: LinkLocale; label: string }[] = [
  { value: "uz", label: "Oʻzbekcha" },
  { value: "ru", label: "Русский" },
  { value: "en", label: "English" },
];

/** utm_* value: lower-case Latin, digits, "-" and "_" ("Sentabr qabul" → "sentabr-qabul", "IT_Kuz" → "it_kuz"). */
export function toUtmValue(input: string): string {
  return input
    .split("_")
    .map((part) => slugify(part))
    .filter(Boolean)
    .join("_")
    .slice(0, 100);
}

const LOCALE_PREFIX = /^\/(uz|ru|en)(?=\/|$)/;

/** Site path from free input ("media/", "/ru/kurslar?x=1", a pasted full URL …) → "/media" without query, hash or locale. */
export function normalizePath(input: string): string {
  let raw = input.trim();
  if (/^https?:\/\//i.test(raw)) {
    try {
      raw = new URL(raw).pathname;
    } catch {
      raw = "/";
    }
  }
  raw = raw.split(/[?#]/)[0];
  if (!raw.startsWith("/")) raw = `/${raw}`;
  raw = raw.replace(/\/{2,}/g, "/").replace(LOCALE_PREFIX, "");
  const clean = raw
    .split("/")
    .map((segment) => segment.replace(/[^A-Za-z0-9._~-]/g, ""))
    .filter(Boolean)
    .join("/");
  return `/${clean}`;
}

/** Adds the language prefix: ("/kurslar", "ru") → "/ru/kurslar"; ("/", "en") → "/en". */
export function localizedPath(path: string, locale: LinkLocale): string {
  if (locale === "uz") return path;
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

export interface TaggedLinkInput {
  origin: string;
  path: string;
  locale: LinkLocale;
  source: string;
  medium?: string;
  campaign?: string;
  content?: string;
}

/** Full tagged URL, e.g. https://edutech.uz/ig?utm_source=instagram&utm_medium=bio. Empty tags are left out. */
export function buildTaggedUrl({ origin, path, locale, source, medium, campaign, content }: TaggedLinkInput): string {
  const url = new URL(localizedPath(normalizePath(path), locale), origin);
  const tags: [string, string | undefined][] = [
    ["utm_source", source],
    ["utm_medium", medium],
    ["utm_campaign", campaign],
    ["utm_content", content],
  ];
  for (const [key, value] of tags) if (value) url.searchParams.set(key, value);
  return url.toString();
}
