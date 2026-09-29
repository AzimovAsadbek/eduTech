import { detectInApp, type InApp } from "./user-agent";

/**
 * Browser-side marketing attribution.
 *
 * On the first page of a browser session we record where the visitor came from — UTM tags, an
 * external referrer, the in-app browser (Instagram / Facebook / Telegram) and Meta's click id —
 * as the session's touch, and keep the first touch with a source for 30 days. Lead forms send both,
 * and the server decides which one the lead is credited to.
 *
 * Everything is best-effort: storage can be unavailable (private mode, some in-app browsers).
 */

export interface Touch {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingPath?: string;
  fbclid?: string;
  inApp?: InApp;
  at: number;
}

export interface AttributionPayload {
  sessionId?: string;
  first?: Touch;
  last?: Touch;
  page?: string;
  fbc?: string;
  fbp?: string;
}

export interface TouchDefaults {
  utmSource: string;
  utmMedium?: string;
}

const SESSION_KEY = "et_sid";
const LAST_KEY = "et_last";
const FIRST_KEY = "et_first";
const FIRST_TTL_MS = 30 * 86_400_000;
const MAX = 300;

const store = {
  get(kind: "local" | "session", key: string): string | null {
    try {
      return (kind === "local" ? window.localStorage : window.sessionStorage).getItem(key);
    } catch {
      return null;
    }
  },
  set(kind: "local" | "session", key: string, value: string) {
    try {
      (kind === "local" ? window.localStorage : window.sessionStorage).setItem(key, value);
    } catch {
      /* storage unavailable */
    }
  },
};

function readJson<T>(kind: "local" | "session", key: string): T | null {
  const raw = store.get(kind, key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function cookie(name: string): string | undefined {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }
}

const clip = (v: string | null | undefined) => (v ? v.trim().slice(0, MAX) || undefined : undefined);

function externalReferrer(): string | undefined {
  const ref = document.referrer;
  if (!ref) return undefined;
  try {
    return new URL(ref).host === window.location.host ? undefined : clip(ref);
  } catch {
    return undefined;
  }
}

/** A touch "has a source" when it can be attributed to anything other than a direct visit. */
export function hasSource(t: Pick<Touch, "utmSource" | "referrer" | "inApp" | "fbclid"> | null | undefined): boolean {
  return Boolean(t && (t.utmSource || t.referrer || t.inApp || t.fbclid));
}

/** Reads the current URL + referrer + user agent into a touch. `defaults` tag untagged landings (e.g. the Instagram bio page). */
export function readTouch(defaults?: TouchDefaults): Touch {
  const q = new URLSearchParams(window.location.search);
  const utmSource = clip(q.get("utm_source"));
  return {
    utmSource: utmSource ?? defaults?.utmSource,
    utmMedium: clip(q.get("utm_medium")) ?? (utmSource ? undefined : defaults?.utmMedium),
    utmCampaign: clip(q.get("utm_campaign")),
    utmContent: clip(q.get("utm_content")),
    utmTerm: clip(q.get("utm_term")),
    fbclid: clip(q.get("fbclid")),
    referrer: externalReferrer(),
    landingPath: window.location.pathname.slice(0, MAX),
    inApp: detectInApp(navigator.userAgent) ?? undefined,
    at: Date.now(),
  };
}

function isTagged(t: Touch): boolean {
  return Boolean(t.utmSource || t.fbclid);
}

/**
 * Call once per page load. Starts a session on the first page view (returns `isNewSession`),
 * refreshes the session touch when a new tagged link was opened, and maintains the 30-day first touch.
 */
export function captureAttribution(defaults?: TouchDefaults): { sessionId: string; isNewSession: boolean; touch: Touch } {
  const touch = readTouch(defaults);
  let sessionId = store.get("session", SESSION_KEY);
  const isNewSession = !sessionId;
  if (!sessionId) {
    sessionId = newId();
    store.set("session", SESSION_KEY, sessionId);
  }

  const last = readJson<Touch>("session", LAST_KEY);
  if (isNewSession || !last || isTagged(touch)) store.set("session", LAST_KEY, JSON.stringify(touch));

  const first = readJson<Touch>("local", FIRST_KEY);
  const expired = !first || Date.now() - first.at > FIRST_TTL_MS;
  if (expired || (!hasSource(first) && hasSource(touch))) store.set("local", FIRST_KEY, JSON.stringify(touch));

  return { sessionId, isNewSession, touch };
}

/** Everything a lead form sends alongside the contact details. */
export function getAttribution(): AttributionPayload {
  if (typeof window === "undefined") return {};
  const payload: AttributionPayload = {
    sessionId: store.get("session", SESSION_KEY) ?? undefined,
    first: readJson<Touch>("local", FIRST_KEY) ?? undefined,
    last: readJson<Touch>("session", LAST_KEY) ?? undefined,
    page: window.location.pathname.slice(0, MAX),
    fbc: clip(cookie("_fbc")),
    fbp: clip(cookie("_fbp")),
  };
  return JSON.parse(JSON.stringify(payload)) as AttributionPayload;
}

/** True when this visitor arrived from Instagram (tagged link, Instagram referrer or the Instagram in-app browser). */
export function cameFromInstagram(): boolean {
  if (typeof window === "undefined") return false;
  const last = readJson<Touch>("session", LAST_KEY);
  const t = last ?? readTouch();
  return Boolean(
    t.inApp === "instagram" || /^(ig|insta|instagram)/i.test(t.utmSource ?? "") || /(^|\.)instagram\.com$/i.test(safeHost(t.referrer) ?? "") || /com\.instagram/i.test(t.referrer ?? ""),
  );
}

function safeHost(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}
