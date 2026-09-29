import type { ChannelKey } from "@/lib/channels";
import { detectInApp, type InApp } from "@/lib/user-agent";

export { detectDevice, detectInApp, isBot, type Device, type InApp } from "@/lib/user-agent";

/**
 * Pure attribution helpers — no I/O, unit-tested.
 *
 * Classification order (strongest signal first):
 *   1. explicit UTM tags (utm_source) — what the business put on the link
 *   2. in-app browser (Instagram / Facebook webviews often drop the referrer)
 *   3. referrer host (incl. android-app:// package referrers)
 *   4. Meta click id (fbclid) without other signals
 *   5. otherwise DIRECT
 */

export interface ChannelSignals {
  utmSource?: string | null;
  referrer?: string | null;
  userAgent?: string | null;
  inApp?: InApp | null;
  fbclid?: string | null;
  /** Host of this site — internal referrers are ignored. */
  siteHost?: string | null;
}

const SOURCE_PATTERNS: [RegExp, ChannelKey][] = [
  [/^(ig|insta|instagram)([_\-.].*)?$|instagram/, "INSTAGRAM"],
  [/^(fb|facebook|meta|msg|an|messenger)([_\-.].*)?$|facebook/, "FACEBOOK"],
  [/^(tg|telegram|t\.me)([_\-.].*)?$|telegram/, "TELEGRAM"],
  [/^(google|gads|adwords)([_\-.].*)?$/, "GOOGLE"],
  [/^(yandex|ya|yandex_direct)([_\-.].*)?$/, "YANDEX"],
  [/^(youtube|yt)([_\-.].*)?$/, "YOUTUBE"],
];

const HOST_PATTERNS: [RegExp, ChannelKey][] = [
  [/(^|\.)instagram\.com$/, "INSTAGRAM"],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me|m\.me|messenger\.com)$/, "FACEBOOK"],
  [/(^|\.)(t\.me|telegram\.me|telegram\.org|telegram\.dog)$/, "TELEGRAM"],
  [/(^|\.)google\.[a-z.]+$/, "GOOGLE"],
  [/(^|\.)(yandex\.[a-z.]+|ya\.ru)$/, "YANDEX"],
  [/(^|\.)(youtube\.com|youtu\.be)$/, "YOUTUBE"],
];

const APP_PACKAGES: [RegExp, ChannelKey][] = [
  [/^com\.instagram\.(android|barcelona)/, "INSTAGRAM"],
  [/^com\.facebook\.(katana|orca|lite)/, "FACEBOOK"],
  [/^org\.telegram\.|^org\.thunderdog\.challegram/, "TELEGRAM"],
  [/^com\.google\.android\.googlequicksearchbox/, "GOOGLE"],
  [/^ru\.yandex\./, "YANDEX"],
  [/^com\.google\.android\.youtube/, "YOUTUBE"],
];

/** Lower-cased host of a referrer (http(s) URL or android-app:// URI); null when missing/invalid. */
export function referrerHost(referrer?: string | null): string | null {
  if (!referrer) return null;
  try {
    const u = new URL(referrer);
    if (u.protocol === "android-app:") return u.hostname.toLowerCase() || null;
    return u.hostname.replace(/^www\./, "").toLowerCase() || null;
  } catch {
    return null;
  }
}

function fromSource(utmSource: string): ChannelKey {
  const v = utmSource.trim().toLowerCase();
  for (const [re, ch] of SOURCE_PATTERNS) if (re.test(v)) return ch;
  return "OTHER";
}

function fromReferrer(referrer: string, siteHost?: string | null): ChannelKey | null {
  let u: URL;
  try {
    u = new URL(referrer);
  } catch {
    return null;
  }
  if (u.protocol === "android-app:") {
    const pkg = u.hostname.toLowerCase();
    for (const [re, ch] of APP_PACKAGES) if (re.test(pkg)) return ch;
    return "REFERRAL";
  }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();
  if (!host) return null;
  const site = siteHost?.replace(/^www\./, "").toLowerCase();
  if (site && (host === site || host.endsWith(`.${site}`))) return null; // internal navigation
  for (const [re, ch] of HOST_PATTERNS) if (re.test(host)) return ch;
  return "REFERRAL";
}

export function classifyChannel(s: ChannelSignals): ChannelKey {
  if (s.utmSource?.trim()) return fromSource(s.utmSource);
  const inApp = s.inApp ?? detectInApp(s.userAgent);
  if (inApp === "instagram") return "INSTAGRAM";
  if (inApp === "facebook") return "FACEBOOK";
  if (s.referrer) {
    const ch = fromReferrer(s.referrer, s.siteHost);
    if (ch) return ch;
  }
  if (inApp === "telegram") return "TELEGRAM";
  if (s.fbclid) return "FACEBOOK";
  return "DIRECT";
}

/** Meta's click-id cookie format: fb.<subdomainIndex>.<creationTimeMs>.<fbclid>. */
export function fbcFromClickId(fbclid: string, createdAtMs: number): string {
  return `fb.1.${Math.floor(createdAtMs)}.${fbclid}`;
}
