import type { Metadata } from "next";
import { Inbox, Percent, Sparkles, Clapperboard, GraduationCap, CalendarRange } from "lucide-react";
import { redirect } from "next/navigation";
import { getAuth } from "@/server/modules/auth/service";
import { listLeads, leadStats } from "@/server/modules/leads/service";
import { listResource } from "@/server/modules/content/admin";
import { resources, type ResourceKey } from "@/server/modules/content/registry";
import { roleAtLeast } from "@/components/admin/labels";
import { Button } from "@/components/admin/ui/button";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/card";
import { PageHeader } from "@/components/admin/ui/page-header";
import { KpiCards } from "@/components/admin/dashboard/kpi-cards";
import { LeadsOverTimeChart, StatusFunnel, TopBarChart, TypeBreakdownChart, type SeriesPoint } from "@/components/admin/dashboard/charts";
import { RangeSelector } from "@/components/admin/dashboard/range-selector";
import { RecentLeads } from "@/components/admin/dashboard/recent-leads";
import { EditorHome, type ContentCount } from "@/components/admin/dashboard/editor-home";

export const metadata: Metadata = { title: "Boshqaruv" };

const RANGES = new Set([7, 30, 90]);

function buildSeries(days: number, rows: { day: string; type: string; count: number }[]): SeriesPoint[] {
  const map = new Map<string, SeriesPoint>();
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { day: key, EDUCATION: 0, MEDIA: 0, GENERAL: 0 });
  }
  for (const r of rows) {
    const p = map.get(r.day);
    if (!p) continue;
    if (r.type === "EDUCATION" || r.type === "MEDIA" || r.type === "GENERAL") p[r.type] += r.count;
  }
  return [...map.values()];
}

const CONTENT_KEYS: { key: ResourceKey; href: string }[] = [
  { key: "courses", href: "/admin/courses" },
  { key: "course-categories", href: "/admin/course-categories" },
  { key: "teachers", href: "/admin/teachers" },
  { key: "results", href: "/admin/results" },
  { key: "testimonials", href: "/admin/testimonials" },
  { key: "faq", href: "/admin/faq" },
  { key: "services", href: "/admin/services" },
  { key: "media-projects", href: "/admin/media-projects" },
  { key: "gallery", href: "/admin/gallery" },
  { key: "branches", href: "/admin/branches" },
];

async function contentCounts(): Promise<ContentCount[]> {
  return Promise.all(
    CONTENT_KEYS.map(async ({ key, href }) => {
      const def = resources[key];
      const [all, published] = await Promise.all([
        listResource(key, { page: 1, pageSize: 1 }),
        def.hasStatus ? listResource(key, { page: 1, pageSize: 1, status: "PUBLISHED" }) : null,
      ]);
      return { href, label: def.label, total: all.total, published: published?.total };
    }),
  );
}

export default async function AdminDashboardPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const [auth, sp] = await Promise.all([getAuth(), searchParams]);
  if (!auth) redirect("/admin/login");
  const parsed = Number(sp.days ?? 30);
  const days = RANGES.has(parsed) ? parsed : 30;

  if (!roleAtLeast(auth.user.role, "ADMIN")) {
    const counts = await contentCounts();
    return (
      <>
        <PageHeader eyebrow="Boshqaruv" title={`Salom, ${auth.user.name.split(" ")[0]}`} description="Kontent boʻlimlari va ularning holati." />
        <EditorHome counts={counts} />
      </>
    );
  }

  const [stats, recent] = await Promise.all([leadStats(days), listLeads({ page: 1, pageSize: 8, sort: "createdAt", dir: "desc" })]);
  const series = buildSeries(days, stats.series);

  const kpis = [
    { label: "Jami lidlar", value: stats.total, icon: <Inbox />, hint: "barcha vaqt" },
    { label: "Yangi", value: stats.newCount, icon: <Sparkles />, accent: stats.newCount > 0, hint: "koʻrib chiqilmagan" },
    { label: "Taʼlim", value: stats.byType.EDUCATION ?? 0, icon: <GraduationCap />, hint: "kurslarga" },
    { label: "Media", value: stats.byType.MEDIA ?? 0, icon: <Clapperboard />, hint: "xizmatlarga" },
    { label: "Konversiya", value: `${stats.conversionRate}%`, icon: <Percent />, hint: "yakunlangan / yopilgan" },
    { label: `Oxirgi ${days} kun`, value: stats.recent, icon: <CalendarRange />, hint: "yangi murojaatlar" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Boshqaruv"
        title={`Salom, ${auth.user.name.split(" ")[0]}`}
        description="Lidlar oqimi, konversiya va eng talabgir yoʻnalishlar."
        actions={<RangeSelector days={days} />}
      />

      <KpiCards items={kpis} />

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Lidlar dinamikasi" description={`Oxirgi ${days} kun, turlar boʻyicha`} />
          <CardBody>
            <LeadsOverTimeChart data={series} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Holatlar voronkasi" description="Barcha vaqt boʻyicha" />
          <CardBody>
            <StatusFunnel byStatus={stats.byStatus} />
            <div className="mt-5 border-t border-(--line) pt-4">
              <p className="t-eyebrow mb-2 text-[10px] text-muted">Turlar boʻyicha</p>
              <TypeBreakdownChart byType={stats.byType} />
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader title="Top kurslar" description="Eng koʻp murojaat" />
          <CardBody>
            <TopBarChart data={stats.topCourses} emptyTitle="Kurslarga murojaat yoʻq" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Top xizmatlar" description="Eng koʻp soʻrov" />
          <CardBody>
            <TopBarChart data={stats.topServices} emptyTitle="Xizmatlarga soʻrov yoʻq" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Soʻnggi lidlar"
            description="Oxirgi 8 ta murojaat"
            actions={
              <Button href="/admin/leads" variant="ghost" size="xs">
                Barchasi
              </Button>
            }
          />
          <RecentLeads leads={recent.items} />
        </Card>
      </div>
    </>
  );
}
