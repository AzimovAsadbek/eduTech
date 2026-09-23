import { adminRoute } from "@/server/http/admin";
import { parseJson } from "@/server/http/request";
import { created, ok } from "@/server/http/response";
import { adminUserCreateSchema } from "@/server/modules/auth/schema";
import { createUser, listUsers } from "@/server/modules/auth/service";

export const GET = adminRoute("SUPER_ADMIN", async () => ok(await listUsers()));

export const POST = adminRoute("SUPER_ADMIN", async (req, { auth }) => {
  const input = await parseJson(req, adminUserCreateSchema);
  return created(await createUser(input, auth.user.id));
});
