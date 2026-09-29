import "server-only";
import type { Channel, Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { env } from "@/lib/env";
import { classifyChannel, detectDevice, detectInApp, fbcFromClickId, isBot, referrerHost } from "./channel";
import type { AttributionInput, Touch, VisitInput } from "./schema";

const FIRST_TOUCH_WINDOW_MS = 30 * 86_400_000;

function siteHost(): string | null {
  try {
    return new URL(env().NEXT_PUBLIC_SITE_URL).hostname;
  } catch {
    return null;
  }
}

function touchChannel(t: Touch | undefined, userAgent?: string | null): Channel {
  return classifyChannel({
    utmSource: t?.utmSource,
    referrer: t?.referrer,
    inApp: t?.inApp,
    fbclid: t?.fbclid,
    userAgent,
    siteHost: siteHost(),
  });
}

const cleanPath = (p?: string) => (p ? p.split("?")[0].slice(0, 300) : null);

/** Records the first page view of a browser session (idempotent per session). Bots are ignored. */
export async function recordVisit(input: VisitInput, meta: { userAgent?: string | null }): Promise<{ recorded: boolean }> {
  if (isBot(meta.userAgent)) return { recorded: false };
  const t = input.touch;
  const inApp = t.inApp ?? detectInApp(meta.userAgent);
  const data = {
    sessionId: input.sessionId,
    channel: touchChannel({ ...t, inApp: inApp ?? undefined }, meta.userAgent),
    utmSource: t.utmSource?.toLowerCase() || null,
    utmMedium: t.utmMedium?.toLowerCase() || null,
    utmCampaign: t.utmCampaign?.toLowerCase() || null,
    utmContent: t.utmContent || null,
    referrerHost: referrerHost(t.referrer),
    landingPath: cleanPath(t.landingPath) ?? "/",
    locale: input.locale ?? null,
    device: detectDevice(meta.userAgent),
    inApp,
  };
  try {
    await db.visit.create({ data });
    return { recorded: true };
  } catch (e) {
    // Unique sessionId: the session was already recorded (reloads, double mounts).
    if ((e as { code?: string }).code === "P2002") return { recorded: false };
    throw e;
  }
}

export interface LeadAttribution {
  channel: Channel;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  landingPage: string | null;
  referrer: string | null;
  sessionId: string | null;
  utm: Prisma.InputJsonValue;
  /** Absolute URL the form was submitted from (for Meta CAPI). */
  pageUrl: string | null;
  fbc: string | null;
  fbp: string | null;
}

/**
 * Picks the touch a lead is credited to: the current session's touch when it has a source,
 * otherwise the first touch of the last 30 days when that one has a source (someone who came from
 * Instagram on Monday and typed the address on Wednesday is still an Instagram lead).
 */
export function resolveLeadAttribution(input: AttributionInput | undefined, meta: { userAgent?: string | null; now?: number }): LeadAttribution {
  const now = meta.now ?? Date.now();
  const last = input?.last;
  const first = input?.first && (!input.first.at || now - input.first.at <= FIRST_TOUCH_WINDOW_MS) ? input.first : undefined;

  const lastChannel = last ? touchChannel(last, meta.userAgent) : null;
  const firstChannel = first ? touchChannel(first, meta.userAgent) : null;
  let credited: Touch | undefined = last;
  let channel: Channel = lastChannel ?? firstChannel ?? touchChannel(undefined, meta.userAgent);
  if ((!lastChannel || lastChannel === "DIRECT") && firstChannel && firstChannel !== "DIRECT") {
    credited = first;
    channel = firstChannel;
  }

  const clickId = credited?.fbclid ?? last?.fbclid ?? first?.fbclid;
  const clickAt = credited?.at ?? now;
  const fbc = input?.fbc || (clickId ? fbcFromClickId(clickId, clickAt) : null);
  const base = (() => {
    try {
      return new URL(env().NEXT_PUBLIC_SITE_URL).origin;
    } catch {
      return "";
    }
  })();

  return {
    channel,
    utmSource: credited?.utmSource?.toLowerCase() || null,
    utmMedium: credited?.utmMedium?.toLowerCase() || null,
    utmCampaign: credited?.utmCampaign?.toLowerCase() || null,
    utmContent: credited?.utmContent || null,
    landingPage: cleanPath(credited?.landingPath),
    referrer: referrerHost(credited?.referrer),
    sessionId: input?.sessionId ?? null,
    pageUrl: input?.page ? `${base}${cleanPath(input.page)}` : null,
    fbc,
    fbp: input?.fbp || null,
    utm: JSON.parse(
      JSON.stringify({
        first: first ?? null,
        last: last ?? null,
        page: cleanPath(input?.page),
        fbc,
        fbp: input?.fbp || null,
        userAgent: meta.userAgent?.slice(0, 300) ?? null,
      }),
    ) as Prisma.InputJsonValue,
  };
}
