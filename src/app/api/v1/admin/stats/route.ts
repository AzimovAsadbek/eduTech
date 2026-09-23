import { z } from "zod";
import { adminRoute } from "@/server/http/admin";
import { parseQuery } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { leadStats } from "@/server/modules/leads/service";

export const GET = adminRoute("ADMIN", async (req) => {
  const { days } = parseQuery(req, z.object({ days: z.coerce.number().int().min(7).max(365).default(30) }));
  return ok(await leadStats(days));
});
