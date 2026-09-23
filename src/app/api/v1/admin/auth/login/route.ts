import { env } from "@/lib/env";
import { limits } from "@/server/http/rate-limit";
import { assertSameOrigin, clientIp, parseJson } from "@/server/http/request";
import { handler, ok } from "@/server/http/response";
import { loginSchema } from "@/server/modules/auth/schema";
import { login } from "@/server/modules/auth/service";

export const POST = handler(async (req) => {
  const ip = clientIp(req);
  await limits.login().consume(ip);
  assertSameOrigin(req, env().NEXT_PUBLIC_SITE_URL);
  const input = await parseJson(req, loginSchema);
  const result = await login(input, { ip, userAgent: req.headers.get("user-agent") ?? undefined });
  return ok(result.user);
});
