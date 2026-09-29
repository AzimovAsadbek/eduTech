import { env } from "@/lib/env";
import { limits } from "@/server/http/rate-limit";
import { assertSameOrigin, clientIp, parseJson } from "@/server/http/request";
import { handler, ok } from "@/server/http/response";
import { visitInputSchema } from "@/server/modules/attribution/schema";
import { recordVisit } from "@/server/modules/attribution/service";

/** First page view of a browser session — feeds the channel funnel (visits → leads → enrolled). */
export const POST = handler(async (req) => {
  await limits.visit().consume(clientIp(req));
  assertSameOrigin(req, env().NEXT_PUBLIC_SITE_URL);
  const input = await parseJson(req, visitInputSchema);
  return ok(await recordVisit(input, { userAgent: req.headers.get("user-agent") }));
});
