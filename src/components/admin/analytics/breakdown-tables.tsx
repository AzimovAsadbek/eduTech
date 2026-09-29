import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { CampaignRow, CourseRow, PlacementRow } from "@/server/modules/analytics/types";
import { ChannelBadge } from "./channel-badge";
import { formatCount, formatRate } from "./format";

const th = "t-eyebrow h-9 border-b border-(--line) px-3 text-[10px] font-medium text-muted first:pl-5 last:pr-5";
const td = "px-3 py-2 align-top first:pl-5 last:pr-5";

/** Count with its conversion underneath ("12" / "3,2%"), so narrow cards keep four readable columns. */
function CountRate({ value, rate, of, hint, rateClassName }: { value: number; rate?: number; of?: number; hint?: string; rateClassName?: string }) {
  return (
    <span className="block text-right tabular-nums">
      <span className="text-ink block font-semibold">{formatCount(value)}</span>
      {rate !== undefined && of !== undefined ? (
        <span className={cn("t-meta text-muted block text-[11px]", rateClassName)} title={hint}>
          {formatRate(rate, of)}
        </span>
      ) : null}
    </span>
  );
}

function Frame({ caption, head, children, className }: { caption: string; head: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className="relative overflow-x-auto">
      <table className={cn("w-full border-collapse text-[13px]", className)}>
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-paper-2">{head}</thead>
        <tbody className="divide-y divide-(--line)">{children}</tbody>
      </table>
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-muted px-5 py-8 text-center text-sm">{children}</p>;
}

const LEAD_HINT = "tashrifdan arizaga";
const ENROLL_HINT = "arizadan kursga";

/** Instagram traffic by placement (utm_medium). */
export function PlacementsTable({ rows }: { rows: PlacementRow[] }) {
  if (!rows.length) return <Empty>Bu davrda Instagramdan tashrif yoki ariza yoʻq.</Empty>;
  return (
    <Frame
      caption="Instagram joylashuvlari boʻyicha tashrif, ariza va kursga yozilganlar"
      className="min-w-[340px]"
      head={
        <tr>
          <th scope="col" className={cn(th, "text-left")}>
            Joylashuv
          </th>
          <th scope="col" className={cn(th, "text-right")}>
            Tashrif
          </th>
          <th scope="col" className={cn(th, "text-right")}>
            Ariza
          </th>
          <th scope="col" className={cn(th, "text-right")}>
            Yozildi
          </th>
        </tr>
      }
    >
      {rows.map((r) => (
        <tr key={r.medium ?? "∅"}>
          <th scope="row" className={cn(td, "text-left font-normal")}>
            {r.medium ? (
              <>
                <span className="text-ink block font-semibold">{r.label}</span>
                {r.label !== r.medium ? <span className="t-meta text-muted block text-[11px]">{r.medium}</span> : null}
              </>
            ) : (
              <>
                <span className="text-muted block italic">{r.label}</span>
                <span className="t-meta text-muted-2 block text-[11px]">teg qoʻyilmagan</span>
              </>
            )}
          </th>
          <td className={td}>
            <CountRate value={r.visits} />
          </td>
          <td className={td}>
            <CountRate value={r.leads} rate={r.leadRate} of={r.visits} hint={LEAD_HINT} />
          </td>
          <td className={td}>
            <CountRate value={r.enrolled} rate={r.enrollRate} of={r.leads} hint={ENROLL_HINT} />
          </td>
        </tr>
      ))}
    </Frame>
  );
}

const leadsHref = (r: Pick<CampaignRow, "channel" | "campaign">) => `/admin/leads?channel=${r.channel}&campaign=${encodeURIComponent(r.campaign)}`;

/**
 * Tagged campaigns (utm_campaign); the name opens the matching leads.
 * `withChannel` is the full-width variant: a channel column and separate rate columns from `md` up;
 * on phones it folds back into the compact four-column layout (badge above the name, rates under the counts).
 */
export function CampaignsTable({ rows, withChannel = false, empty }: { rows: CampaignRow[]; withChannel?: boolean; empty?: ReactNode }) {
  if (!rows.length) return <Empty>{empty ?? "Kampaniya tegli havolalar orqali hali tashrif yoki ariza kelmagan."}</Empty>;
  // Columns that only exist in the full-width variant, and only from `md` up.
  const wide = "hidden md:table-cell";
  const compactRate = withChannel ? "md:hidden" : undefined;
  return (
    <Frame
      caption="Kampaniyalar boʻyicha tashrif, ariza va kursga yozilganlar"
      className={withChannel ? "min-w-[340px] md:min-w-[720px]" : "min-w-[340px]"}
      head={
        <tr>
          {withChannel ? (
            <th scope="col" className={cn(th, wide, "w-40 text-left")}>
              Kanal
            </th>
          ) : null}
          <th scope="col" className={cn(th, "text-left", withChannel && "max-md:pl-5")}>
            Kampaniya
          </th>
          <th scope="col" className={cn(th, "text-right")}>
            Tashrif
          </th>
          <th scope="col" className={cn(th, "text-right")}>
            Ariza
          </th>
          {withChannel ? (
            <th scope="col" className={cn(th, wide, "text-right")} title="Tashrifdan arizaga oʻtganlar ulushi">
              Ariza %
            </th>
          ) : null}
          <th scope="col" className={cn(th, "text-right", withChannel && "max-md:pr-5")}>
            Yozildi
          </th>
          {withChannel ? (
            <th scope="col" className={cn(th, wide, "text-right")} title="Arizadan kursga yozilganlar ulushi">
              Yozilish %
            </th>
          ) : null}
        </tr>
      }
    >
      {rows.map((r) => (
        <tr key={`${r.channel}:${r.campaign}`} className="hover:bg-paper-2 transition-colors duration-150">
          {withChannel ? (
            <td className={cn(td, wide, "align-middle")}>
              <ChannelBadge channel={r.channel} />
            </td>
          ) : null}
          <th scope="row" className={cn(td, "text-left font-normal", withChannel && "max-md:pl-5 md:align-middle")}>
            {withChannel ? <ChannelBadge channel={r.channel} className="mb-1.5 md:hidden" /> : null}
            <Link
              href={leadsHref(r)}
              className="text-ink hover:text-orange block font-mono text-[12.5px] font-medium break-all underline-offset-4 hover:underline"
              title="Shu kampaniya lidlarini ochish"
            >
              {r.campaign}
            </Link>
          </th>
          <td className={cn(td, withChannel && "md:align-middle")}>
            <CountRate value={r.visits} />
          </td>
          <td className={cn(td, withChannel && "md:align-middle")}>
            <CountRate value={r.leads} rate={r.leadRate} of={r.visits} hint={LEAD_HINT} rateClassName={compactRate} />
          </td>
          {withChannel ? <td className={cn(td, wide, "text-ink text-right align-middle tabular-nums")}>{formatRate(r.leadRate, r.visits)}</td> : null}
          <td className={cn(td, withChannel && "max-md:pr-5 md:align-middle")}>
            <CountRate value={r.enrolled} rate={r.enrollRate} of={r.leads} hint={ENROLL_HINT} rateClassName={compactRate} />
          </td>
          {withChannel ? <td className={cn(td, wide, "text-ink text-right align-middle tabular-nums")}>{formatRate(r.enrollRate, r.leads)}</td> : null}
        </tr>
      ))}
    </Frame>
  );
}

/** Courses Instagram leads applied for, with how many of them enrolled. */
export function CoursesTable({ rows }: { rows: CourseRow[] }) {
  if (!rows.length) return <Empty>Instagramdan kurslarga ariza hali yoʻq.</Empty>;
  const max = Math.max(1, ...rows.map((r) => r.leads));
  return (
    <ul className="divide-y divide-(--line)">
      {rows.map((r) => (
        <li key={r.courseId} className="px-5 py-3">
          <div className="flex items-baseline justify-between gap-3 text-[13px]">
            <Link href={`/admin/courses/${r.courseId}`} className="text-ink hover:text-orange min-w-0 truncate font-semibold">
              {r.title}
            </Link>
            <span className="text-muted shrink-0 tabular-nums">
              <span className="text-ink font-semibold">{formatCount(r.leads)}</span> ariza ·{" "}
              <span className="text-ink font-semibold">{formatCount(r.enrolled)}</span> yozildi
            </span>
          </div>
          <div className="bg-paper-3 mt-2 flex h-1.5 overflow-hidden rounded-full" aria-hidden>
            <span className="h-full rounded-full bg-[#E1306C]" style={{ width: `${Math.max(3, (r.leads / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
