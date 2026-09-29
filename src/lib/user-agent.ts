/**
 * User-agent helpers shared by the browser (attribution capture) and the server (visits, leads).
 * Pure functions, no I/O.
 */

export type InApp = "instagram" | "facebook" | "telegram";
export type Device = "mobile" | "tablet" | "desktop";

export function detectInApp(userAgent?: string | null): InApp | null {
  if (!userAgent) return null;
  if (/Instagram/i.test(userAgent)) return "instagram";
  if (/FBAN|FBAV|FB_IAB|FBIOS|FB4A|\[FB/i.test(userAgent)) return "facebook";
  if (/Telegram/i.test(userAgent)) return "telegram";
  return null;
}

export function detectDevice(userAgent?: string | null): Device {
  if (!userAgent) return "desktop";
  // Android tablets omit "Mobile"; checked on the whole UA (in-app browsers repeat "Android" later in the string).
  if (/iPad|Tablet|PlayBook|Silk/i.test(userAgent) || (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent))) return "tablet";
  if (/Mobi|iPhone|iPod|Android|Opera Mini|IEMobile/i.test(userAgent)) return "mobile";
  return "desktop";
}

const BOT_UA = /bot\b|bot\/|crawl|spider|slurp|preview|facebookexternalhit|facebookcatalog|embedly|quora link|pinterest|whatsapp|headless|lighthouse|pagespeed|phantomjs|puppeteer|playwright|python-requests|curl\/|wget/i;

export function isBot(userAgent?: string | null): boolean {
  return !userAgent || BOT_UA.test(userAgent);
}
