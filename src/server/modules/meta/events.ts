import { createHash } from "node:crypto";
import type { Channel, LeadType } from "@prisma/client";

/**
 * Pure builders for Meta Conversions API events (unit-tested). Personal data is only ever sent
 * SHA-256 hashed, as Meta requires; nothing here performs I/O.
 */

export const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

/** Meta phone normalisation: digits only, with country code, no "+" or leading zeros. */
export function hashPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "").replace(/^0+/, "");
  return digits.length >= 7 ? sha256(digits) : null;
}

/** First/last name hashes (lower-case, letters only). */
export function hashName(fullName: string): { fn?: string[]; ln?: string[] } {
  const parts = fullName
    .toLowerCase()
    .normalize("NFKC")
    .split(/\s+/)
    // letters only — modifier letters such as the Uzbek ʻ are treated as punctuation
    .map((p) => p.replace(/[^\p{Lu}\p{Ll}\p{Lt}\p{Lo}]/gu, ""))
    .filter(Boolean);
  if (!parts.length) return {};
  return { fn: [sha256(parts[0])], ...(parts.length > 1 ? { ln: [sha256(parts[parts.length - 1])] } : {}) };
}

export interface MetaUserData {
  ph?: string[];
  fn?: string[];
  ln?: string[];
  country?: string[];
  external_id?: string[];
  client_ip_address?: string;
  client_user_agent?: string;
  fbc?: string;
  fbp?: string;
}

export interface MetaEvent {
  event_name: "Lead" | "CompleteRegistration";
  event_time: number;
  event_id: string;
  action_source: "website" | "system_generated";
  event_source_url?: string;
  user_data: MetaUserData;
  custom_data?: Record<string, string>;
}

export interface LeadForMeta {
  id: string;
  type: LeadType;
  channel: Channel;
  name: string;
  phone: string;
  sessionId?: string | null;
  createdAt: Date;
  course?: { title: string } | null;
  service?: { title: string } | null;
}

export interface MetaContext {
  ip?: string | null;
  userAgent?: string | null;
  pageUrl?: string | null;
  fbc?: string | null;
  fbp?: string | null;
}

function userData(lead: LeadForMeta, ctx: MetaContext): MetaUserData {
  const ph = hashPhone(lead.phone);
  const ip = ctx.ip && ctx.ip !== "0.0.0.0" ? ctx.ip : undefined;
  return {
    ...(ph ? { ph: [ph] } : {}),
    ...hashName(lead.name),
    country: [sha256("uz")],
    ...(lead.sessionId ? { external_id: [sha256(lead.sessionId)] } : {}),
    ...(ip ? { client_ip_address: ip } : {}),
    ...(ctx.userAgent ? { client_user_agent: ctx.userAgent } : {}),
    ...(ctx.fbc ? { fbc: ctx.fbc } : {}),
    ...(ctx.fbp ? { fbp: ctx.fbp } : {}),
  };
}

function customData(lead: LeadForMeta): Record<string, string> {
  const name = lead.course?.title ?? lead.service?.title;
  return { content_category: lead.type, lead_channel: lead.channel, ...(name ? { content_name: name } : {}) };
}

/** Website form submission. event_id = lead id, so the browser Pixel event with the same id is de-duplicated. */
export function buildLeadEvent(lead: LeadForMeta, ctx: MetaContext): MetaEvent {
  return {
    event_name: "Lead",
    event_time: Math.floor(lead.createdAt.getTime() / 1000),
    event_id: lead.id,
    action_source: "website",
    ...(ctx.pageUrl ? { event_source_url: ctx.pageUrl } : {}),
    user_data: userData(lead, ctx),
    custom_data: customData(lead),
  };
}

/** The lead enrolled (status CONVERTED in the CRM) — lets Meta optimise ads for real students, not just form fills. */
export function buildEnrollmentEvent(lead: LeadForMeta, ctx: MetaContext, at: Date = new Date()): MetaEvent {
  return {
    event_name: "CompleteRegistration",
    event_time: Math.floor(at.getTime() / 1000),
    event_id: `${lead.id}:enrolled`,
    action_source: "system_generated",
    user_data: userData(lead, ctx),
    custom_data: { ...customData(lead), status: "enrolled" },
  };
}
