import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";
import { locales } from "@/i18n/routing";
import { localePath } from "@/lib/seo";
import { getPublicSlugs } from "@/server/modules/content/public";

// Generated per request (from the tagged data cache) so the build never needs a live database.
export const dynamic = "force-dynamic";

type Entry = MetadataRoute.Sitemap[number];
type Freq = NonNullable<Entry["changeFrequency"]>;

/** One sitemap entry per locale for a locale-free path, each carrying the full hreflang set. */
function localized(path: string, lastModified: Date, changeFrequency: Freq, priority: number): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(locales.map((l) => [l, absoluteUrl(localePath(path, l))]));
  return locales.map((l) => ({ url: absoluteUrl(localePath(path, l)), lastModified, changeFrequency, priority, alternates: { languages } }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { courses, services, projects } = await getPublicSlugs();
  const now = new Date();
  return [
    ...localized("/", now, "weekly", 1),
    ...localized("/kurslar", now, "weekly", 0.9),
    ...localized("/media", now, "weekly", 0.9),
    ...localized("/media/portfolio", now, "weekly", 0.7),
    ...localized("/natijalar", now, "monthly", 0.7),
    ...localized("/biz-haqimizda", now, "monthly", 0.6),
    ...localized("/kontakt", now, "monthly", 0.6),
    ...courses.flatMap((c) => localized(`/kurslar/${c.slug}`, c.updatedAt, "monthly", 0.8)),
    ...services.flatMap((s) => localized(`/media/xizmatlar/${s.slug}`, s.updatedAt, "monthly", 0.8)),
    ...projects.flatMap((p) => localized(`/media/portfolio/${p.slug}`, p.updatedAt, "monthly", 0.6)),
  ];
}
