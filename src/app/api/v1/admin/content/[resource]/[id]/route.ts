import { adminRoute } from "@/server/http/admin";
import { notFound } from "@/server/http/errors";
import { parseJson } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { deleteResource, getResource, updateResource } from "@/server/modules/content/admin";
import { isResourceKey, resources } from "@/server/modules/content/registry";

type P = { resource: string; id: string };

function key(resource: string) {
  if (!isResourceKey(resource)) throw notFound("Resurs topilmadi");
  return resource;
}

export const GET = adminRoute<P>("EDITOR", async (_req, { params }) => ok(await getResource(key(params.resource), params.id)));

export const PATCH = adminRoute<P>("EDITOR", async (req, { params, auth }) => {
  const k = key(params.resource);
  const input = await parseJson(req, resources[k].schema.partial());
  return ok(await updateResource(k, params.id, input as Record<string, unknown>, auth.user.id));
});

export const DELETE = adminRoute<P>("ADMIN", async (_req, { params, auth }) => {
  await deleteResource(key(params.resource), params.id, auth.user.id);
  return ok({ deleted: true });
});
