import { z } from "zod";
import { badRequest, forbidden } from "./errors";

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}

export async function parseJson<T extends z.ZodTypeAny>(req: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw badRequest("JSON body expected");
  }
  return schema.parse(body);
}

export function parseQuery<T extends z.ZodTypeAny>(req: Request, schema: T): z.infer<T> {
  const url = new URL(req.url);
  const obj: Record<string, string> = {};
  url.searchParams.forEach((v, k) => (obj[k] = v));
  return schema.parse(obj);
}

/**
 * CSRF defence for cookie-authenticated, state-changing requests:
 * the browser must send a same-origin `Origin` (or `Sec-Fetch-Site: same-origin`).
 * Non-browser clients (tests, curl) without an Origin are allowed only when explicitly flagged.
 */
export function assertSameOrigin(req: Request, siteUrl: string) {
  const method = req.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;
  const fetchSite = req.headers.get("sec-fetch-site");
  if (fetchSite === "same-origin" || fetchSite === "none") return;
  const origin = req.headers.get("origin");
  if (!origin) {
    if (fetchSite === null) return; // non-browser client; cookie auth still required
    throw forbidden("Cross-site request blocked");
  }
  const allowed = new Set([new URL(siteUrl).origin, new URL(req.url).origin]);
  if (!allowed.has(origin)) throw forbidden("Cross-site request blocked");
}

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
