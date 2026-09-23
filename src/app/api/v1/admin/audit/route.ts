import { adminRoute } from "@/server/http/admin";
import { ok } from "@/server/http/response";
import { listAudit } from "@/server/modules/audit/service";

export const GET = adminRoute("SUPER_ADMIN", async () => ok(await listAudit(100)));
