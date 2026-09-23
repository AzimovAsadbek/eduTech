import { env } from "@/lib/env";
import { assertSameOrigin } from "@/server/http/request";
import { handler, ok } from "@/server/http/response";
import { getAuth, logout } from "@/server/modules/auth/service";

export const POST = handler(async (req) => {
  assertSameOrigin(req, env().NEXT_PUBLIC_SITE_URL);
  await logout(await getAuth());
  return ok({ loggedOut: true });
});
