/**
 * Analytics facade. Events always go to `window.dataLayer` (GTM / GA4 ready). When the Meta Pixel
 * is configured, conversion events are mirrored to it; the Lead event carries the lead id so Meta can
 * de-duplicate it against the server-side Conversions API event. No personal data is sent from here.
 */
export type AnalyticsEvent =
  | "cta_click"
  | "course_view"
  | "service_view"
  | "application_submit"
  | "media_inquiry_submit"
  | "phone_click"
  | "telegram_click"
  | "instagram_click"
  | "ig_welcome_view"
  | "ig_welcome_click";

type Payload = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: (...args: unknown[]) => void;
  }
}

const META_EVENTS: Partial<Record<AnalyticsEvent, "Lead" | "ViewContent" | "Contact">> = {
  application_submit: "Lead",
  media_inquiry_submit: "Lead",
  course_view: "ViewContent",
  service_view: "ViewContent",
  phone_click: "Contact",
  telegram_click: "Contact",
  instagram_click: "Contact",
};

export function track(event: AnalyticsEvent, payload: Payload = {}) {
  if (typeof window === "undefined") return;
  const entry = { event, ...payload, ts: Date.now() };
  (window.dataLayer ??= []).push(entry);
  if (process.env.NODE_ENV === "development") console.debug("[analytics]", entry);

  const metaEvent = META_EVENTS[event];
  if (metaEvent && typeof window.fbq === "function") {
    const { leadId, ...params } = payload;
    if (leadId) window.fbq("track", metaEvent, params, { eventID: String(leadId) });
    else window.fbq("track", metaEvent, params);
  }
}
