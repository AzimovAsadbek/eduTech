/**
 * Marketing channels shared by the admin UI, exports and notifications.
 * Mirrors the Prisma `Channel` enum; client-safe (no server imports).
 */
export const CHANNELS = ["INSTAGRAM", "FACEBOOK", "TELEGRAM", "GOOGLE", "YANDEX", "YOUTUBE", "DIRECT", "REFERRAL", "OTHER"] as const;
export type ChannelKey = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<ChannelKey, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TELEGRAM: "Telegram",
  GOOGLE: "Google",
  YANDEX: "Yandex",
  YOUTUBE: "YouTube",
  DIRECT: "Toʻgʻridan-toʻgʻri",
  REFERRAL: "Boshqa saytlar",
  OTHER: "Boshqa",
};

/** Brand-ish colours for charts; Instagram uses its magenta so it stands out on dashboards. */
export const CHANNEL_COLORS: Record<ChannelKey, string> = {
  INSTAGRAM: "#E1306C",
  FACEBOOK: "#1877F2",
  TELEGRAM: "#229ED9",
  GOOGLE: "#34A853",
  YANDEX: "#FC3F1D",
  YOUTUBE: "#FF0000",
  DIRECT: "#111111",
  REFERRAL: "#737373",
  OTHER: "#A3A3A3",
};

/** Where an Instagram link was placed — used as utm_medium by the admin link builder. */
export const INSTAGRAM_PLACEMENTS = [
  { value: "bio", label: "Profil havolasi (bio)" },
  { value: "story", label: "Stories" },
  { value: "reels", label: "Reels" },
  { value: "post", label: "Post" },
  { value: "highlight", label: "Highlights" },
  { value: "direct", label: "Direct (DM)" },
  { value: "ads", label: "Reklama (target)" },
] as const;

export function isChannel(value: string | null | undefined): value is ChannelKey {
  return Boolean(value) && (CHANNELS as readonly string[]).includes(value as string);
}
