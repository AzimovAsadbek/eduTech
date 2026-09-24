import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/config/site";
import { locales, ogLocales, routing, type Locale } from "@/i18n/routing";

interface PageSeo {
  title: string;
  description: string;
  /** Locale-free path, e.g. "/kurslar/dasturlash". */
  path: string;
  locale: Locale;
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  noindex?: boolean;
  keywords?: string[];
}

const DEFAULT_OG = "/opengraph-image";
const MAX_TITLE = 60;
const MAX_DESC = 158;

/** Trims to a limit on a word boundary so search snippets never end mid-word. */
export function clamp(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(" ") > max * 0.6 ? cut.lastIndexOf(" ") : cut.length)}…`;
}

/** Public URL for a path in a locale: Uzbek at the root, others prefixed. */
export function localePath(path: string, locale: Locale): string {
  const clean = path === "/" ? "" : path;
  return locale === routing.defaultLocale ? clean || "/" : `/${locale}${clean}`;
}

/**
 * Builds complete, consistent metadata for a public page: title/description within
 * search-snippet limits, locale-aware canonical + hreflang alternates, full OpenGraph and
 * Twitter cards (page image or the branded default) and robots directives.
 */
export function pageMetadata(seo: PageSeo): Metadata {
  const title = clamp(seo.title, MAX_TITLE);
  const description = clamp(seo.description, MAX_DESC);
  const canonical = localePath(seo.path, seo.locale);
  const url = absoluteUrl(canonical);
  const image = seo.image ? absoluteUrl(seo.image) : absoluteUrl(DEFAULT_OG);
  const imageAlt = seo.imageAlt ?? `${title} — ${siteConfig.name}`;
  const fullTitle = `${title} — ${siteConfig.name}`;
  const languages = Object.fromEntries(locales.map((l) => [l, absoluteUrl(localePath(seo.path, l))]));
  return {
    title,
    description,
    keywords: seo.keywords ? [...siteConfig.keywords, ...seo.keywords] : undefined,
    alternates: { canonical, languages: { ...languages, "x-default": absoluteUrl(localePath(seo.path, routing.defaultLocale)) } },
    openGraph: {
      type: seo.type ?? "website",
      locale: ogLocales[seo.locale],
      alternateLocale: locales.filter((l) => l !== seo.locale).map((l) => ogLocales[l]),
      siteName: siteConfig.name,
      url,
      title: fullTitle,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: imageAlt }],
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [{ url: image, alt: imageAlt }] },
    robots: seo.noindex ? { index: false, follow: false } : undefined,
  };
}

export const notFoundMetadata: Metadata = { title: "Sahifa topilmadi", robots: { index: false, follow: false } };
