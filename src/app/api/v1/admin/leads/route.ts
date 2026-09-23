import { adminRoute } from "@/server/http/admin";
import { parseQuery } from "@/server/http/request";
import { paginated } from "@/server/http/response";
import { leadFilterSchema } from "@/server/modules/leads/schema";
import { listLeads } from "@/server/modules/leads/service";

export const GET = adminRoute("ADMIN", async (req) => {
  const filter = parseQuery(req, leadFilterSchema);
  const { items, total, page, pageSize } = await listLeads(filter);
  return paginated(items, { page, pageSize, total });
});
