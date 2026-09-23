import { z } from "zod";
import { adminRoute } from "@/server/http/admin";
import { notFound } from "@/server/http/errors";
import { parseJson } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { reorderResource } from "@/server/modules/content/admin";
import { isResourceKey } from "@/server/modules/content/registry";

export const POST = adminRoute<{ resource: string }>("EDITOR", async (req, { params, auth }) => {
  if (!isResourceKey(params.resource)) throw notFound("Resurs topilmadi");
  const { ids } = await parseJson(req, z.object({ ids: z.array(z.string()).min(1).max(500) }));
  await reorderResource(params.resource, ids, auth.user.id);
  return ok({ reordered: ids.length });
});
