import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { getAuth } from "@/server/modules/auth/service";
import { getPublishedCourses } from "@/server/modules/content/public";
import { rangeFromSearch } from "@/server/modules/analytics/schema";
import { channelAnalytics } from "@/server/modules/analytics/service";
import { roleAtLeast } from "@/components/admin/labels";
import { CampaignsTable } from "@/components/admin/analytics/breakdown-tables";
import { RangeSelector } from "@/components/admin/dashboard/range-selector";
import { LinkBuilder } from "@/components/admin/links/link-builder";
import { Card } from "@/components/admin/ui/card";
import { Forbidden } from "@/components/admin/ui/forbidden";
import { PageHeader } from "@/components/admin/ui/page-header";

export const metadata: Metadata = { title: "Havolalar" };

function siteOrigin(): string {
  try {
    return new URL(env().NEXT_PUBLIC_SITE_URL).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export default async function LinksPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const [auth, sp] = await Promise.all([getAuth(), searchParams]);
  if (!auth) redirect("/admin/login");
  if (!roleAtLeast(auth.user.role, "ADMIN")) return <Forbidden description="Havolalar boʻlimi faqat adminlar uchun." />;

  const days = rangeFromSearch(sp.days);
  const [courses, analytics] = await Promise.all([getPublishedCourses(), channelAnalytics({ days })]);
  const campaignNames = [...new Set(analytics.campaigns.map((c) => c.campaign))];

  return (
    <>
      <PageHeader
        eyebrow="Marketing"
        title="Havolalar"
        description="Instagram va boshqa kanallarga qoʻyiladigan belgilangan (UTM) havolalar. Ular orqali kelgan har bir tashrif, ariza va kursga yozilish kanal, joylashuv va kampaniya boʻyicha hisoblanadi."
      />

      <LinkBuilder origin={siteOrigin()} courses={courses.map((c) => ({ slug: c.slug, title: c.title }))} campaigns={campaignNames} />

      <section aria-labelledby="campaigns-title" className="mt-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 id="campaigns-title" className="t-h3 text-ink">
              Kampaniyalar natijasi
            </h2>
            <p className="text-muted mt-1 text-sm">Oxirgi {days} kun, barcha kanallar · kampaniya nomini bossangiz, uning lidlari ochiladi.</p>
          </div>
          <RangeSelector days={days} />
        </div>
        <Card>
          <CampaignsTable
            rows={analytics.campaigns}
            withChannel
            empty="Bu davrda kampaniya tegli havolalar orqali tashrif yoki ariza kelmagan. Yuqorida havola yarating va kampaniya nomini qoʻshing."
          />
        </Card>
      </section>
    </>
  );
}
