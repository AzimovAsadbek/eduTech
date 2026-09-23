import { env } from "@/lib/env";
import { limits } from "@/server/http/rate-limit";
import { assertSameOrigin, clientIp, parseJson } from "@/server/http/request";
import { created, handler } from "@/server/http/response";
import { publicLeadSchema } from "@/server/modules/leads/schema";
import { createPublicLead } from "@/server/modules/leads/service";

export const POST = handler(async (req) => {
  const ip = clientIp(req);
  await limits.publicLead().consume(ip);
  assertSameOrigin(req, env().NEXT_PUBLIC_SITE_URL);
  const input = await parseJson(req, publicLeadSchema);
  const lead = await createPublicLead(input, { ip });
  return created(lead);
});
