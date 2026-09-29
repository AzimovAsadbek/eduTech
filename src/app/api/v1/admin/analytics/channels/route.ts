import { adminRoute } from "@/server/http/admin";
import { parseQuery } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { analyticsQuerySchema } from "@/server/modules/analytics/schema";
import { channelAnalytics } from "@/server/modules/analytics/service";

/** Channel funnel (visits → leads → enrolled), Instagram placements/campaigns and response times. */
export const GET = adminRoute("ADMIN", async (req) => {
  const { days } = parseQuery(req, analyticsQuerySchema);
  return ok(await channelAnalytics({ days }));
});
