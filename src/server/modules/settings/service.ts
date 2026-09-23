import "server-only";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { db } from "@/server/db";
import { CacheTags, invalidate } from "@/server/cache";
import { audit } from "@/server/modules/audit/service";

export const siteSettingsSchema = z.object({
  brandName: z.string().default("EduTech"),
  tagline: z.string().default("Zamonaviy kasblar akademiyasi"),
  city: z.string().default("Namangan"),
  address: z.string().default(""),
  phone: z.string().default(""),
  phoneSecondary: z.string().default(""),
  email: z.string().default(""),
  telegram: z.string().default(""),
  instagram: z.string().default(""),
  youtube: z.string().default(""),
  workingHours: z.string().default("Du–Sh 09:00–19:00"),
  mapEmbedUrl: z.string().default(""),
  stats: z
    .object({
      students: z.string().default("500+"),
      courses: z.string().default("9+"),
      projects: z.string().default("100+"),
    })
    .default({ students: "500+", courses: "9+", projects: "100+" }),
  telegramNotifications: z.boolean().default(true),
});
export type SiteSettings = z.infer<typeof siteSettingsSchema>;

const KEY = "site";

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSettings> => {
    const row = await db.siteSetting.findUnique({ where: { key: KEY } });
    return siteSettingsSchema.parse(row?.value ?? {});
  },
  ["site-settings"],
  { tags: [CacheTags.settings] },
);

export async function updateSiteSettings(patch: Partial<SiteSettings>, actorId: string): Promise<SiteSettings> {
  const current = siteSettingsSchema.parse((await db.siteSetting.findUnique({ where: { key: KEY } }))?.value ?? {});
  const next = siteSettingsSchema.parse({ ...current, ...patch });
  await db.siteSetting.upsert({ where: { key: KEY }, create: { key: KEY, value: next }, update: { value: next } });
  await audit({ userId: actorId, action: "UPDATE", entity: "SiteSetting", entityId: KEY, meta: { fields: Object.keys(patch) } });
  invalidate(CacheTags.settings);
  return next;
}
