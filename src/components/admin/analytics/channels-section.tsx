import { Info, Link2, Radar } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ChannelAnalytics } from "@/server/modules/analytics/types";
import { Button } from "@/components/admin/ui/button";
import { Card, CardBody, CardHeader } from "@/components/admin/ui/card";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { CampaignsTable, CoursesTable, PlacementsTable } from "./breakdown-tables";
import { ChannelTable } from "./channel-table";
import { InstagramFunnel } from "./instagram-funnel";
import { InstagramStrip } from "./instagram-strip";
import { InstagramTrend } from "./instagram-trend";

function Notice({ children }: { children: ReactNode }) {
  return (
    <p className="bg-paper text-muted flex items-start gap-2.5 rounded-(--radius-md) border border-(--line) px-4 py-3 text-[13px]">
      <Info size={16} className="text-orange mt-px shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

/** Dashboard section: where people come from, who applies, who enrols, and how fast staff respond. */
export function ChannelsSection({ data }: { data: ChannelAnalytics }) {
  const { totals, instagram } = data;
  const hasData = totals.visits > 0 || totals.leads > 0;
  const hasInstagram = instagram.funnel.visits > 0 || instagram.funnel.leads > 0;

  return (
    <section aria-labelledby="channels-title" className="mt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="t-eyebrow text-orange mb-2">Marketing</p>
          <h2 id="channels-title" className="t-h3 text-ink">
            Kanallar va Instagram
          </h2>
          <p className="text-muted mt-1 max-w-2xl text-sm">
            Oxirgi {data.days} kun: qayerdan kelishdi, kim ariza qoldirdi, kim kursga yozildi va qanchalik tez javob berildi.
          </p>
        </div>
        <Button href="/admin/links" variant="outline" size="sm" icon={<Link2 />}>
          Havola yaratish
        </Button>
      </div>

      {!hasData ? (
        <Card>
          <EmptyState
            icon={<Radar />}
            title="Hali tashrif va arizalar yoʻq"
            description="Maʼlumotlar sayt trafik olgach shu yerda paydo boʻladi. Instagram bio, stories va postlar uchun belgilangan havola yarating — shunda har bir ariza qayerdan kelgani aniq koʻrinadi."
            action={
              <Button href="/admin/links" size="sm" icon={<Link2 />}>
                Havola yaratish
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-4">
          <InstagramStrip data={data} />

          {totals.visits === 0 ? (
            <Notice>Saytga tashriflar hali qayd etilmagan — konversiya foizlari sayt trafik olgach hisoblanadi.</Notice>
          ) : totals.leads > totals.visits ? (
            <Notice>
              Tashriflar yaqinda qayd etila boshlangan: bu davrdagi ayrim arizalar uchun tashrif yozilmagan, shuning uchun umumiy konversiya vaqtincha yuqori
              koʻrinadi.
            </Notice>
          ) : null}

          <Card>
            <CardHeader title="Kanallar kesimida" description="Tashrif → ariza → kursga yozilish va birinchi javobgacha oʻtgan vaqt (median)" />
            <ChannelTable rows={data.byChannel} totals={totals} />
          </Card>

          {hasInstagram ? (
            <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              <Card>
                <CardHeader title="Instagram voronkasi" description="Har bosqichdan keyingisiga oʻtganlar ulushi" />
                <CardBody>
                  <InstagramFunnel funnel={instagram.funnel} />
                </CardBody>
              </Card>
              <Card className="xl:col-span-2">
                <CardHeader title="Instagram: kunlik dinamika" description="Tashriflar va arizalar, alohida shkalada" />
                <CardBody>
                  <InstagramTrend data={instagram.series} />
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="Joylashuv boʻyicha" description="Bio, stories, reels … (utm_medium)" />
                <PlacementsTable rows={instagram.placements} />
              </Card>
              <Card>
                <CardHeader title="Instagram kampaniyalari" description="Eng koʻp ariza olib kelganlar" />
                <CampaignsTable
                  rows={instagram.campaigns}
                  empty={
                    <>
                      Kampaniya tegli Instagram havolalari hali yoʻq.{" "}
                      <Link href="/admin/links" className="text-ink hover:text-orange font-semibold underline-offset-4 hover:underline">
                        Havola yaratish
                      </Link>
                    </>
                  }
                />
              </Card>
              <Card>
                <CardHeader title="Kurslar boʻyicha" description="Instagram arizalari va kursga yozilganlar" />
                <CoursesTable rows={instagram.topCourses} />
              </Card>
            </div>
          ) : (
            <Card>
              <EmptyState
                compact
                icon={<Radar />}
                title="Instagramdan hali tashrif yoʻq"
                description="Profil havolasi (bio) va stories uchun belgilangan havola qoʻying — Instagram voronkasi, joylashuvlar va kampaniyalar shu yerda koʻrinadi."
                action={
                  <Button href="/admin/links" size="sm" variant="outline" icon={<Link2 />}>
                    Instagram havolasini olish
                  </Button>
                }
              />
            </Card>
          )}
        </div>
      )}
    </section>
  );
}
