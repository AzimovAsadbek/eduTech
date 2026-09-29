import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ChannelsSection } from "@/components/admin/analytics/channels-section";
import type { ChannelAnalytics, ChannelRow } from "@/server/modules/analytics/types";

function analytics(overrides: Partial<ChannelAnalytics> = {}): ChannelAnalytics {
  return {
    days: 30,
    range: { from: "2026-08-16T19:00:00.000Z", to: "2026-09-15T19:00:00.000Z", timeZone: "Asia/Tashkent" },
    totals: { visits: 0, leads: 0, contacted: 0, enrolled: 0, leadRate: 0, enrollRate: 0, medianResponseMinutes: null },
    byChannel: [],
    instagram: {
      funnel: { visits: 0, leads: 0, contacted: 0, enrolled: 0 },
      leadRate: 0,
      enrollRate: 0,
      medianResponseMinutes: null,
      placements: [],
      campaigns: [],
      topCourses: [],
      series: [{ day: "2026-09-15", visits: 0, leads: 0 }],
    },
    campaigns: [],
    ...overrides,
  };
}

const row = (r: Partial<ChannelRow> & Pick<ChannelRow, "channel">): ChannelRow => ({
  visits: 0,
  leads: 0,
  contacted: 0,
  enrolled: 0,
  lost: 0,
  leadRate: 0,
  enrollRate: 0,
  medianResponseMinutes: null,
  ...r,
});

const render = (data: ChannelAnalytics) => renderToStaticMarkup(<ChannelsSection data={data} />);

describe("ChannelsSection", () => {
  it("explains that data appears with traffic and links to the link builder when there is nothing yet", () => {
    const html = render(analytics());
    expect(html).toContain("Hali tashrif va arizalar yoʻq");
    expect(html).toContain('href="/admin/links"');
    expect(html).not.toContain("Kanallar kesimida");
  });

  it("flags missing visit tracking and shows an Instagram empty state when only direct leads exist", () => {
    const html = render(
      analytics({
        totals: { visits: 0, leads: 3, contacted: 1, enrolled: 0, leadRate: 0, enrollRate: 0, medianResponseMinutes: 12 },
        byChannel: [row({ channel: "DIRECT", leads: 3, contacted: 1, medianResponseMinutes: 12 })],
      }),
    );
    expect(html).toContain("Saytga tashriflar hali qayd etilmagan");
    expect(html).toContain("Kanallar kesimida");
    expect(html).toContain("Instagramdan hali tashrif yoʻq");
    expect(html).not.toContain(">Instagram voronkasi</h2>");
  });

  it("renders the Instagram strip, funnel and placements when Instagram has traffic", () => {
    const html = render(
      analytics({
        totals: { visits: 200, leads: 12, contacted: 9, enrolled: 3, leadRate: 6, enrollRate: 25, medianResponseMinutes: 45 },
        byChannel: [row({ channel: "INSTAGRAM", visits: 150, leads: 10, contacted: 8, enrolled: 3, leadRate: 6.7, enrollRate: 30, medianResponseMinutes: 90 })],
        instagram: {
          funnel: { visits: 150, leads: 10, contacted: 8, enrolled: 3 },
          leadRate: 6.7,
          enrollRate: 30,
          medianResponseMinutes: 90,
          placements: [{ medium: "story", label: "Stories", visits: 100, leads: 8, enrolled: 3, leadRate: 8, enrollRate: 37.5 }],
          campaigns: [{ channel: "INSTAGRAM", campaign: "kuz_qabul", visits: 80, leads: 6, enrolled: 2, leadRate: 7.5, enrollRate: 33.3 }],
          topCourses: [],
          series: [{ day: "2026-09-15", visits: 150, leads: 10 }],
        },
      }),
    );
    expect(html).toContain(">Instagram voronkasi</h2>");
    expect(html).toContain("6,7%"); // lead conversion
    expect(html).toContain("1,5 soat"); // median response
    expect(html).toContain("Stories");
    expect(html).toContain("2 ta Instagram arizasi javob kutmoqda");
    expect(html).toContain('href="/admin/leads?channel=INSTAGRAM&amp;campaign=kuz_qabul"');
    expect(html).not.toContain("Saytga tashriflar hali qayd etilmagan");
  });
});
