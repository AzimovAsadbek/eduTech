import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";
import { getPublicSlugs } from "@/server/modules/content/public";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { courses, services, projects } = await getPublicSlugs();
  const now = new Date();
  const statics: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/kurslar"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/media"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/media/portfolio"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/natijalar"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/biz-haqimizda"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/kontakt"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
  return [
    ...statics,
    ...courses.map((c) => ({ url: absoluteUrl(`/kurslar/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...services.map((s) => ({ url: absoluteUrl(`/media/xizmatlar/${s.slug}`), lastModified: s.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...projects.map((p) => ({ url: absoluteUrl(`/media/portfolio/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
  ];
}
