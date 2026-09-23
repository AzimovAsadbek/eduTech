import { leadFilterSchema, type LeadFilter } from "@/server/modules/leads/schema";

export type SearchParamsLike = Record<string, string | string[] | undefined>;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** URL search params → validated lead filter (date-only `to` becomes end of that day). */
export function leadFilterFromSearch(sp: SearchParamsLike): LeadFilter {
  const raw: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const val = Array.isArray(v) ? v[0] : v;
    if (val !== undefined && val !== "") raw[k] = val;
  }
  if (raw.to && DATE_ONLY.test(raw.to)) raw.to = `${raw.to}T23:59:59.999`;
  if (raw.from && DATE_ONLY.test(raw.from)) raw.from = `${raw.from}T00:00:00.000`;
  const parsed = leadFilterSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  // Drop invalid keys one by one so a bad value in the URL never breaks the page.
  const bad = new Set(parsed.error.issues.map((i) => String(i.path[0])));
  const cleaned = Object.fromEntries(Object.entries(raw).filter(([k]) => !bad.has(k)));
  return leadFilterSchema.parse(cleaned);
}

/** Same transformation for the export link, keeping the user-facing values. */
export function exportQueryFromSearch(sp: URLSearchParams): string {
  const out = new URLSearchParams();
  sp.forEach((v, k) => {
    if (k === "page" || k === "pageSize" || !v) return;
    if (k === "to" && DATE_ONLY.test(v)) out.set(k, `${v}T23:59:59.999`);
    else if (k === "from" && DATE_ONLY.test(v)) out.set(k, `${v}T00:00:00.000`);
    else out.set(k, v);
  });
  const s = out.toString();
  return s ? `?${s}` : "";
}
