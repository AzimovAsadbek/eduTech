import "server-only";
import type { Role } from "@prisma/client";
import { env } from "@/lib/env";
import { requireRole, type AuthContext } from "@/server/modules/auth/service";
import { limits } from "./rate-limit";
import { assertSameOrigin, clientIp } from "./request";
import { fail } from "./response";

type Handler<P> = (req: Request, ctx: { auth: AuthContext; params: P; ip: string }) => Promise<Response>;

/**
 * Admin API guard: rate limit → CSRF (same-origin) → session + role.
 * Every /api/v1/admin/* handler goes through here so the authorization layer is uniform.
 */
export function adminRoute<P = Record<string, never>>(minRole: Role, fn: Handler<P>) {
  return async (req: Request, routeCtx: { params: Promise<P> }) => {
    try {
      const ip = clientIp(req);
      await limits.adminApi().consume(ip);
      assertSameOrigin(req, env().NEXT_PUBLIC_SITE_URL);
      const auth = await requireRole(minRole);
      const params = await routeCtx.params;
      return await fn(req, { auth, params, ip });
    } catch (e) {
      return fail(e);
    }
  };
}
