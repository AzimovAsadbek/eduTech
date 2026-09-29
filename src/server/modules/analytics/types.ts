import type { ChannelKey } from "@/lib/channels";

/**
 * Response shape of `channelAnalytics` / GET /api/v1/admin/analytics/channels.
 * Client-safe (types only). Rates are percentages with one decimal, 0 when the denominator is 0.
 */

/** Visits → leads → first contact → enrolled (lead status CONVERTED), for one slice of traffic. */
export interface FunnelCounts {
  visits: number;
  leads: number;
  /** Leads with `contactedAt` set (they left NEW at least once). */
  contacted: number;
  enrolled: number;
}

export interface ChannelRow extends FunnelCounts {
  channel: ChannelKey;
  lost: number;
  /** leads / visits × 100 */
  leadRate: number;
  /** enrolled / leads × 100 */
  enrollRate: number;
  /** Median of contactedAt − createdAt over contacted leads; null when nobody was contacted yet. */
  medianResponseMinutes: number | null;
}

export interface BreakdownRow {
  visits: number;
  leads: number;
  enrolled: number;
  leadRate: number;
  enrollRate: number;
}

/** Instagram placement = utm_medium (bio, story, reels …); null when the link was not tagged. */
export interface PlacementRow extends BreakdownRow {
  medium: string | null;
  label: string;
}

export interface CampaignRow extends BreakdownRow {
  channel: ChannelKey;
  campaign: string;
}

export interface CourseRow {
  courseId: string;
  title: string;
  slug: string;
  leads: number;
  enrolled: number;
  enrollRate: number;
}

/** One calendar day (business time zone), "YYYY-MM-DD". */
export interface DailyPoint {
  day: string;
  visits: number;
  leads: number;
}

export interface ChannelAnalytics {
  days: number;
  /** [from, to) in ISO; `from` is local midnight `days − 1` days ago, `to` is the end of today. */
  range: { from: string; to: string; timeZone: string };
  totals: FunnelCounts & {
    leadRate: number;
    enrollRate: number;
    medianResponseMinutes: number | null;
  };
  /** Every channel with visits or leads in the window, most leads first. */
  byChannel: ChannelRow[];
  instagram: {
    funnel: FunnelCounts;
    leadRate: number;
    enrollRate: number;
    medianResponseMinutes: number | null;
    placements: PlacementRow[];
    /** Top 10 tagged campaigns. */
    campaigns: CampaignRow[];
    topCourses: CourseRow[];
    /** Exactly `days` points, oldest first, zero-filled. */
    series: DailyPoint[];
  };
  /** Top 20 tagged campaigns across all channels. */
  campaigns: CampaignRow[];
}
