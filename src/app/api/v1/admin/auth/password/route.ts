import { adminRoute } from "@/server/http/admin";
import { parseJson } from "@/server/http/request";
import { ok } from "@/server/http/response";
import { changePasswordSchema } from "@/server/modules/auth/schema";
import { changeOwnPassword } from "@/server/modules/auth/service";

export const POST = adminRoute("EDITOR", async (req, { auth }) => {
  const input = await parseJson(req, changePasswordSchema);
  await changeOwnPassword(auth, input.currentPassword, input.newPassword);
  return ok({ changed: true });
});
