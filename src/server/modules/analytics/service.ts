import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/server/db";
import { CHANNELS, type ChannelKey } from "@/lib/channels";
import { ANALYTICS_TIME_ZONE, analyticsWindow, placementLabel, rate, windowDays } from "./metrics";
import type { BreakdownRow, CampaignRow, ChannelAnalytics, ChannelRow, DailyPoint, PlacementRow } from "./types";

const TOP_CAMPAIGNS = 20;
const TOP_INSTAGRAM_CAMPAIGNS = 10;
const TOP_COURSES = 8;

interface Counts {
  visits: number;
  leads: number;
  contacted: number;
  enrolled: number;
  lost: number;
}

interface LeadGroup {
  channel: ChannelKey;
  medium: string | null;
  campaign: string | null;
  leads: number;
  contacted: number;
  enrolled: number;
  lost: number;
}

interface MedianRow {
  /** NULL for the grand-total grouping set. */
  channel: ChannelKey | null;
  minutes: number | null;
}

interface CourseGroup {
  id: string;
  title: string;
  slug: string;
  leads: number;
  enrolled: number;
}

interface DayRow {
  day: string;
  kind: "visit" | "lead";
  n: number;
}

const zero = (): Counts => ({ visits: 0, leads: 0, contacted: 0, enrolled: 0, lost: 0 });

function bucket<K>(map: Map<K, Counts>, key: K): Counts {
  let c = map.get(key);
  if (!c) map.set(key, (c = zero()));
  return c;
}

function addLeads(c: Counts, g: LeadGroup) {
  c.leads += g.leads;
  c.contacted += g.contacted;
  c.enrolled += g.enrolled;
  c.lost += g.lost;
}

const breakdown = (c: Counts): BreakdownRow => ({
  visits: c.visits,
  leads: c.leads,
  enrolled: c.enrolled,
  leadRate: rate(c.leads, c.visits),
  enrollRate: rate(c.enrolled, c.leads),
});

const minutes = (m: number | null | undefined) => (typeof m === "number" && Number.isFinite(m) ? Math.round(m * 10) / 10 : null);

/** Most leads first, then most visits, then most enrolments. */
const byLeads = (a: BreakdownRow, b: BreakdownRow) => b.leads - a.leads || b.visits - a.visits || b.enrolled - a.enrolled;

/** Converts local day buckets in SQL; the zone name is a constant, never user input. */
const localDay = Prisma.raw(`to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE '${ANALYTICS_TIME_ZONE}', 'YYYY-MM-DD')`);

/**
 * Channel funnel for visits and leads created in the last `days` calendar days (business time zone):
 * visits → leads → contacted → enrolled (status CONVERTED) per channel, the Instagram deep-dive
 * (placements = utm_medium, campaigns, courses, daily series) and the top tagged campaigns.
 *
 * Five queries in parallel: two group-bys over (channel, medium, campaign) that every breakdown is
 * folded from, one percentile query for response times, one course join and one daily series.
 */
export async function channelAnalytics({ days, now = new Date() }: { days: number; now?: Date }): Promise<ChannelAnalytics> {
  const { since, until } = analyticsWindow(days, now);

  const [visitGroups, leadGroups, medians, courses, daily] = await Promise.all([
    db.visit.groupBy({
      by: ["channel", "utmMedium", "utmCampaign"],
      where: { createdAt: { gte: since, lt: until } },
      _count: { _all: true },
    }),
    db.$queryRaw<LeadGroup[]>`
      SELECT "channel", "utmMedium" AS medium, "utmCampaign" AS campaign,
             COUNT(*)::int AS leads,
             COUNT("contactedAt")::int AS contacted,
             (COUNT(*) FILTER (WHERE "status" = 'CONVERTED'))::int AS enrolled,
             (COUNT(*) FILTER (WHERE "status" = 'LOST'))::int AS lost
      FROM "Lead"
      WHERE "createdAt" >= ${since} AND "createdAt" < ${until}
      GROUP BY 1, 2, 3`,
    // Median minutes to first contact, per channel and overall (the empty grouping set, channel = NULL).
    db.$queryRaw<MedianRow[]>`
      SELECT "channel",
             percentile_cont(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM ("contactedAt" - "createdAt")) / 60) AS minutes
      FROM "Lead"
      WHERE "createdAt" >= ${since} AND "createdAt" < ${until} AND "contactedAt" IS NOT NULL
      GROUP BY GROUPING SETS (("channel"), ())`,
    db.$queryRaw<CourseGroup[]>`
      SELECT c."id", c."title", c."slug",
             COUNT(*)::int AS leads,
             (COUNT(*) FILTER (WHERE l."status" = 'CONVERTED'))::int AS enrolled
      FROM "Lead" l
      JOIN "Course" c ON c."id" = l."courseId"
      WHERE l."channel" = 'INSTAGRAM' AND l."createdAt" >= ${since} AND l."createdAt" < ${until}
      GROUP BY c."id", c."title", c."slug"
      ORDER BY leads DESC, enrolled DESC, c."title" ASC
      LIMIT ${TOP_COURSES}`,
    db.$queryRaw<DayRow[]>`
      SELECT ${localDay} AS day, 'visit' AS kind, COUNT(*)::int AS n
      FROM "Visit"
      WHERE "channel" = 'INSTAGRAM' AND "createdAt" >= ${since} AND "createdAt" < ${until}
      GROUP BY 1
      UNION ALL
      SELECT ${localDay} AS day, 'lead' AS kind, COUNT(*)::int AS n
      FROM "Lead"
      WHERE "channel" = 'INSTAGRAM' AND "createdAt" >= ${since} AND "createdAt" < ${until}
      GROUP BY 1`,
  ]);

  // ── Fold the (channel, medium, campaign) groups into every breakdown ──
  const perChannel = new Map<ChannelKey, Counts>();
  const igPlacements = new Map<string | null, Counts>();
  const campaigns = new Map<string, { channel: ChannelKey; campaign: string; counts: Counts }>();
  const campaignCounts = (channel: ChannelKey, campaign: string) => {
    const key = `${channel}\u0000${campaign}`;
    let entry = campaigns.get(key);
    if (!entry) campaigns.set(key, (entry = { channel, campaign, counts: zero() }));
    return entry.counts;
  };

  for (const v of visitGroups) {
    const n = v._count._all;
    bucket(perChannel, v.channel).visits += n;
    if (v.utmCampaign) campaignCounts(v.channel, v.utmCampaign).visits += n;
    if (v.channel === "INSTAGRAM") bucket(igPlacements, v.utmMedium).visits += n;
  }
  for (const g of leadGroups) {
    addLeads(bucket(perChannel, g.channel), g);
    if (g.campaign) addLeads(campaignCounts(g.channel, g.campaign), g);
    if (g.channel === "INSTAGRAM") addLeads(bucket(igPlacements, g.medium), g);
  }

  const medianOf = new Map<ChannelKey | null, number | null>(medians.map((m) => [m.channel, minutes(m.minutes)]));

  const byChannel: ChannelRow[] = CHANNELS.flatMap((channel) => {
    const c = perChannel.get(channel);
    if (!c || (!c.visits && !c.leads)) return [];
    return [
      {
        channel,
        visits: c.visits,
        leads: c.leads,
        contacted: c.contacted,
        enrolled: c.enrolled,
        lost: c.lost,
        leadRate: rate(c.leads, c.visits),
        enrollRate: rate(c.enrolled, c.leads),
        medianResponseMinutes: medianOf.get(channel) ?? null,
      },
    ];
  }).sort(byLeads);

  const total = zero();
  for (const c of perChannel.values()) {
    total.visits += c.visits;
    total.leads += c.leads;
    total.contacted += c.contacted;
    total.enrolled += c.enrolled;
  }

  const campaignRows: CampaignRow[] = [...campaigns.values()]
    .map(({ channel, campaign, counts }) => ({ channel, campaign, ...breakdown(counts) }))
    .sort((a, b) => byLeads(a, b) || a.campaign.localeCompare(b.campaign));

  const placements: PlacementRow[] = [...igPlacements.entries()]
    .map(([medium, c]) => ({ medium, label: placementLabel(medium), ...breakdown(c) }))
    .sort((a, b) => byLeads(a, b) || a.label.localeCompare(b.label));

  const series = new Map<string, DailyPoint>(windowDays(days, now).map((day) => [day, { day, visits: 0, leads: 0 }]));
  for (const r of daily) {
    const point = series.get(r.day);
    if (!point) continue;
    if (r.kind === "visit") point.visits += r.n;
    else point.leads += r.n;
  }

  const ig = perChannel.get("INSTAGRAM") ?? zero();

  return {
    days,
    range: { from: since.toISOString(), to: until.toISOString(), timeZone: ANALYTICS_TIME_ZONE },
    totals: {
      visits: total.visits,
      leads: total.leads,
      contacted: total.contacted,
      enrolled: total.enrolled,
      leadRate: rate(total.leads, total.visits),
      enrollRate: rate(total.enrolled, total.leads),
      medianResponseMinutes: medianOf.get(null) ?? null,
    },
    byChannel,
    instagram: {
      funnel: { visits: ig.visits, leads: ig.leads, contacted: ig.contacted, enrolled: ig.enrolled },
      leadRate: rate(ig.leads, ig.visits),
      enrollRate: rate(ig.enrolled, ig.leads),
      medianResponseMinutes: medianOf.get("INSTAGRAM") ?? null,
      placements,
      campaigns: campaignRows.filter((r) => r.channel === "INSTAGRAM").slice(0, TOP_INSTAGRAM_CAMPAIGNS),
      topCourses: courses.map((c) => ({
        courseId: c.id,
        title: c.title,
        slug: c.slug,
        leads: c.leads,
        enrolled: c.enrolled,
        enrollRate: rate(c.enrolled, c.leads),
      })),
      series: [...series.values()],
    },
    campaigns: campaignRows.slice(0, TOP_CAMPAIGNS),
  };
}
