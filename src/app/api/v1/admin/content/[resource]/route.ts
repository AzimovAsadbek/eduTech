import { adminRoute } from "@/server/http/admin";
import { notFound } from "@/server/http/errors";
import { parseJson, parseQuery } from "@/server/http/request";
import { created, paginated } from "@/server/http/response";
import { createResource, listResource } from "@/server/modules/content/admin";
import { isResourceKey, resources } from "@/server/modules/content/registry";
import { listQuerySchema } from "@/server/modules/content/schema";

type P = { resource: string };

function key(resource: string) {
  if (!isResourceKey(resource)) throw notFound("Resurs topilmadi");
  return resource;
}

export const GET = adminRoute<P>("EDITOR", async (req, { params }) => {
  const k = key(params.resource);
  const query = parseQuery(req, listQuerySchema);
  const { items, total, page, pageSize } = await listResource(k, query);
  return paginated(items, { page, pageSize, total });
});

export const POST = adminRoute<P>("EDITOR", async (req, { params, auth }) => {
  const k = key(params.resource);
  const input = await parseJson(req, resources[k].schema);
  return created(await createResource(k, input as Record<string, unknown>, auth.user.id));
});
