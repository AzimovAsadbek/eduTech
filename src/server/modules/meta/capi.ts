import "server-only";
import { db } from "@/server/db";
import { env } from "@/lib/env";
import { audit } from "@/server/modules/audit/service";
import { buildEnrollmentEvent, buildLeadEvent, type LeadForMeta, type MetaContext, type MetaEvent } from "./events";

/** Server-side Conversions API is active only when both the pixel id and an access token are configured. */
export function metaEnabled(): boolean {
  const e = env();
  return Boolean(e.NEXT_PUBLIC_META_PIXEL_ID && e.META_CAPI_ACCESS_TOKEN);
}

async function post(events: MetaEvent[]): Promise<void> {
  const e = env();
  const base = e.META_API_BASE || "https://graph.facebook.com";
  const url = `${base}/${e.META_GRAPH_VERSION}/${e.NEXT_PUBLIC_META_PIXEL_ID}/events?access_token=${encodeURIComponent(e.META_CAPI_ACCESS_TOKEN)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data: events, ...(e.META_CAPI_TEST_EVENT_CODE ? { test_event_code: e.META_CAPI_TEST_EVENT_CODE } : {}) }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Meta CAPI ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

async function safeSend(leadId: string, event: MetaEvent) {
  try {
    await post([event]);
  } catch (err) {
    console.error("[meta] capi failed", err);
    await audit({ action: "NOTIFY_FAILED", entity: "Lead", entityId: leadId, meta: { target: "meta_capi", event: event.event_name, error: err instanceof Error ? err.message : String(err) } });
  }
}

/** Fired after a public lead is stored. Never throws. */
export async function sendLeadCreated(lead: LeadForMeta, ctx: MetaContext): Promise<void> {
  if (!metaEnabled()) return;
  await safeSend(lead.id, buildLeadEvent(lead, ctx));
}

interface StoredAttribution {
  fbc?: string | null;
  fbp?: string | null;
  userAgent?: string | null;
}

/** Fired when a course lead is marked CONVERTED (enrolled). Never throws. Media service deals are not reported. */
export async function sendLeadConversion(leadId: string): Promise<void> {
  if (!metaEnabled()) return;
  const lead = await db.lead.findUnique({
    where: { id: leadId },
    include: { course: { select: { title: true } }, service: { select: { title: true } } },
  });
  if (!lead || lead.type === "MEDIA") return;
  const stored = (lead.utm && typeof lead.utm === "object" && !Array.isArray(lead.utm) ? lead.utm : {}) as StoredAttribution;
  await safeSend(lead.id, buildEnrollmentEvent(lead, { ip: lead.ip, userAgent: stored.userAgent, fbc: stored.fbc, fbp: stored.fbp }));
}
