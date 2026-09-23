/**
 * Privacy-aware analytics facade. No cookies, no PII. Events go to `window.dataLayer`
 * (GTM / GA4 ready) and to any provider registered via `NEXT_PUBLIC_ANALYTICS_PROVIDER`.
 */
export type AnalyticsEvent =
  | "cta_click"
  | "course_view"
  | "service_view"
  | "application_submit"
  | "media_inquiry_submit"
  | "phone_click"
  | "telegram_click"
  | "instagram_click";

type Payload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function track(event: AnalyticsEvent, payload: Payload = {}) {
  if (typeof window === "undefined") return;
  const entry = { event, ...payload, ts: Date.now() };
  (window.dataLayer ??= []).push(entry);
  if (process.env.NODE_ENV === "development") console.debug("[analytics]", entry);
}
