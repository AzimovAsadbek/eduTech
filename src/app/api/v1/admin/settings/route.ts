import { adminRoute } from "@/server/http/admin";
import { parseJson } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { getSiteSettings, siteSettingsSchema, updateSiteSettings } from "@/server/modules/settings/service";

export const GET = adminRoute("EDITOR", async () => ok(await getSiteSettings()));

export const PATCH = adminRoute("SUPER_ADMIN", async (req, { auth }) => {
  const patch = await parseJson(req, siteSettingsSchema.partial());
  return ok(await updateSiteSettings(patch, auth.user.id));
});
