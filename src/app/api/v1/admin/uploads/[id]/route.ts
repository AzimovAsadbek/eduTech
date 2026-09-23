import { adminRoute } from "@/server/http/admin";
import { ok } from "@/server/http/response";
import { deleteUpload } from "@/server/modules/uploads/service";

export const DELETE = adminRoute<{ id: string }>("ADMIN", async (_req, { params, auth }) => {
  await deleteUpload(params.id, auth.user.id);
  return ok({ deleted: true });
});
