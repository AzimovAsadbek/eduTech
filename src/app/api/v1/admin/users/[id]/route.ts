import { adminRoute } from "@/server/http/admin";
import { badRequest } from "@/server/http/errors";
import { parseJson } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { adminUserUpdateSchema } from "@/server/modules/auth/schema";
import { updateUser } from "@/server/modules/auth/service";

export const PATCH = adminRoute<{ id: string }>("SUPER_ADMIN", async (req, { params, auth }) => {
  const input = await parseJson(req, adminUserUpdateSchema);
  if (params.id === auth.user.id && (input.isActive === false || (input.role && input.role !== "SUPER_ADMIN"))) {
    throw badRequest("Oʻz hisobingizni oʻchira yoki huquqini pasaytira olmaysiz");
  }
  return ok(await updateUser(params.id, input, auth.user.id));
});
