import { adminRoute } from "@/server/http/admin";
import { ok } from "@/server/http/response";

export const GET = adminRoute("EDITOR", async (_req, { auth }) => ok(auth.user));
