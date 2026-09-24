import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/config/site";

interface PageSeo {
  title: string;
  description: string;
  path: string;
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

/**
 * Builds complete, consistent metadata for a public page: title/description within
 * search-snippet limits, canonical URL, full OpenGraph and Twitter cards (page image or the
 * branded default) and robots directives. Nested objects are not deep-merged by Next.js,
 * so every field is set explicitly here.
 */
export function pageMetadata(seo: PageSeo): Metadata {
  const title = clamp(seo.title, MAX_TITLE);
  const description = clamp(seo.description, MAX_DESC);
  const url = absoluteUrl(seo.path);
  const image = seo.image ? absoluteUrl(seo.image) : absoluteUrl(DEFAULT_OG);
  const imageAlt = seo.imageAlt ?? `${title} — ${siteConfig.name}`;
  const fullTitle = `${title} — ${siteConfig.name}`;
  return {
    title,
    description,
    keywords: seo.keywords ? [...siteConfig.keywords, ...seo.keywords] : undefined,
    alternates: { canonical: seo.path },
    openGraph: {
      type: seo.type ?? "website",
      locale: siteConfig.locale,
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
