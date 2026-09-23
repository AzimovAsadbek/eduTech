import { adminRoute } from "@/server/http/admin";
import { parseJson } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { leadUpdateSchema } from "@/server/modules/leads/schema";
import { deleteLead, getLead, updateLead } from "@/server/modules/leads/service";

type P = { id: string };

export const GET = adminRoute<P>("ADMIN", async (_req, { params }) => ok(await getLead(params.id)));

export const PATCH = adminRoute<P>("ADMIN", async (req, { params, auth }) => {
  const input = await parseJson(req, leadUpdateSchema);
  return ok(await updateLead(params.id, input, { id: auth.user.id, name: auth.user.name }));
});

export const DELETE = adminRoute<P>("SUPER_ADMIN", async (_req, { params, auth }) => {
  await deleteLead(params.id, auth.user.id);
  return ok({ deleted: true });
});
