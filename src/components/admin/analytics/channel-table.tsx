import Link from "next/link";
import { CHANNEL_COLORS } from "@/lib/channels";
import { cn } from "@/lib/utils";
import type { ChannelAnalytics, ChannelRow } from "@/server/modules/analytics/types";
import { ChannelBadge } from "./channel-badge";
import { formatCount, formatMinutes, formatRate } from "./format";

const BAR_REST = "rgba(17,17,17,0.26)";

/** Inline magnitude bar + value. Instagram is the emphasised series; other channels stay neutral grey. */
function BarValue({ value, max, emphasis }: { value: number; max: number; emphasis: boolean }) {
  const pct = max && value ? Math.max(4, Math.round((value / max) * 100)) : 0;
  return (
    <span className="flex items-center justify-end gap-3">
      <span aria-hidden className="bg-paper-3 hidden h-1.5 w-20 overflow-hidden rounded-full sm:block">
        <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: emphasis ? CHANNEL_COLORS.INSTAGRAM : BAR_REST }} />
      </span>
      <span className="min-w-10 text-right font-semibold tabular-nums">{formatCount(value)}</span>
    </span>
  );
}

const num = "text-right tabular-nums";

/** Channels side by side: visits, leads, lead %, enrolled, enrol %, median time to first contact. */
export function ChannelTable({ rows, totals }: { rows: ChannelRow[]; totals: ChannelAnalytics["totals"] }) {
  const maxVisits = Math.max(0, ...rows.map((r) => r.visits));
  const maxLeads = Math.max(0, ...rows.map((r) => r.leads));
  // Leads without a recorded visit (e.g. from before visit tracking was switched on) push a rate past 100%.
  const untracked = rows.some((r) => r.leads > r.visits);
  return (
    <div>
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[760px] border-collapse text-sm">
          <caption className="sr-only">Kanallar boʻyicha tashriflar, arizalar va kursga yozilganlar</caption>
          <thead className="bg-paper-2">
            <tr className="t-eyebrow text-muted text-[11px] [&>th]:h-10 [&>th]:border-b [&>th]:border-(--line) [&>th]:px-4 [&>th]:font-medium">
              <th scope="col" className="bg-paper-2 sticky left-0 z-[1] text-left">
                Kanal
              </th>
              <th scope="col" className="text-right">
                Tashriflar
              </th>
              <th scope="col" className="text-right">
                Arizalar
              </th>
              <th scope="col" className="text-right" title="Tashrifdan arizaga oʻtganlar ulushi">
                Ariza %
              </th>
              <th scope="col" className="text-right">
                Kursga yozildi
              </th>
              <th scope="col" className="text-right" title="Arizadan kursga yozilganlar ulushi">
                Yozilish %
              </th>
              <th scope="col" className="text-right">
                Javob vaqti
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--line)">
            {rows.map((r) => {
              const ig = r.channel === "INSTAGRAM";
              return (
                <tr key={r.channel} className={cn("group transition-colors duration-150", ig ? "bg-[#FDF4F8]" : "hover:bg-paper-2")}>
                  <th
                    scope="row"
                    className={cn("sticky left-0 z-[1] h-12 px-4 text-left font-normal", ig ? "bg-[#FDF4F8]" : "bg-paper group-hover:bg-paper-2")}
                  >
                    {ig ? (
                      <span aria-hidden className="absolute inset-y-2 left-0 w-[3px] rounded-r-full" style={{ background: CHANNEL_COLORS.INSTAGRAM }} />
                    ) : null}
                    <Link
                      href={`/admin/leads?channel=${r.channel}`}
                      className="inline-flex rounded-full focus-visible:outline-offset-2"
                      title="Shu kanal lidlarini ochish"
                    >
                      <ChannelBadge channel={r.channel} className={cn("hover:border-(--line-strong)", ig && "border-[#E1306C]/25 font-semibold")} />
                    </Link>
                  </th>
                  <td className="text-ink px-4">
                    <BarValue value={r.visits} max={maxVisits} emphasis={ig} />
                  </td>
                  <td className="text-ink px-4">
                    <BarValue value={r.leads} max={maxLeads} emphasis={ig} />
                  </td>
                  <td className={cn("text-ink px-4", num)}>{formatRate(r.leadRate, r.visits)}</td>
                  <td className={cn("text-ink px-4 font-semibold", num)}>{formatCount(r.enrolled)}</td>
                  <td className={cn("text-ink px-4", num)}>{formatRate(r.enrollRate, r.leads)}</td>
                  <td className={cn("text-ink px-4", num)}>{formatMinutes(r.medianResponseMinutes)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-paper-2 text-ink border-t border-(--line-strong)">
              <th scope="row" className="bg-paper-2 sticky left-0 z-[1] h-11 px-4 text-left text-[13px] font-semibold">
                Jami
              </th>
              <td className={cn("px-4 font-semibold", num)}>{formatCount(totals.visits)}</td>
              <td className={cn("px-4 font-semibold", num)}>{formatCount(totals.leads)}</td>
              <td className={cn("px-4", num)}>{formatRate(totals.leadRate, totals.visits)}</td>
              <td className={cn("px-4 font-semibold", num)}>{formatCount(totals.enrolled)}</td>
              <td className={cn("px-4", num)}>{formatRate(totals.enrollRate, totals.leads)}</td>
              <td className={cn("px-4", num)}>{formatMinutes(totals.medianResponseMinutes)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {untracked ? (
        <p className="t-meta text-muted border-t border-(--line) px-4 py-2.5 leading-relaxed">
          «—» va «&gt;100%»: kanalning ayrim arizalari uchun tashrif qayd etilmagan (masalan, tashriflar kuzatuvi yoqilishidan oldin kelganlar).
        </p>
      ) : null}
    </div>
  );
}
