import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CHANNEL_COLORS } from "@/lib/channels";
import { rate } from "@/server/modules/analytics/metrics";
import type { FunnelCounts } from "@/server/modules/analytics/types";
import { formatCount, formatRate } from "./format";

const STEPS = [
  { key: "visits", label: "Tashrif" },
  { key: "leads", label: "Ariza" },
  { key: "contacted", label: "Bogʻlanildi" },
  { key: "enrolled", label: "Kursga yozildi" },
] as const satisfies readonly { key: keyof FunnelCounts; label: string }[];

/** Tashrif → Ariza → Bogʻlanildi → Kursga yozildi, with the share that made it from the previous step. */
export function InstagramFunnel({ funnel }: { funnel: FunnelCounts }) {
  const max = Math.max(1, ...STEPS.map((s) => funnel[s.key]));
  // Leads of this period nobody has contacted yet — the most actionable number for staff.
  const waiting = Math.max(0, funnel.leads - funnel.contacted);
  return (
    <div>
      <div className="t-eyebrow text-muted mb-2 grid grid-cols-[minmax(0,1fr)_auto_3.5rem] gap-3 text-[10px]" aria-hidden>
        <span>Bosqich</span>
        <span className="text-right">Soni</span>
        <span className="text-right">Oʻtish</span>
      </div>
      <ol className="space-y-3.5">
        {STEPS.map((s, i) => {
          const n = funnel[s.key];
          const prev = i > 0 ? funnel[STEPS[i - 1].key] : null;
          const width = n ? `${Math.max(1.5, (n / max) * 100)}%` : "0%";
          return (
            <li key={s.key}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_3.5rem] items-baseline gap-3 text-sm">
                <span className="text-ink truncate">{s.label}</span>
                <span className="text-ink font-semibold tabular-nums">{formatCount(n)}</span>
                <span className="t-meta text-muted text-right tabular-nums" title={prev === null ? undefined : "oldingi bosqichdan oʻtganlar ulushi"}>
                  {prev === null ? "" : formatRate(rate(n, prev), prev)}
                </span>
              </div>
              <div className="bg-paper-3 mt-1.5 h-2 rounded-[4px]" aria-hidden>
                <div
                  className="h-full rounded-[4px] transition-[width] duration-500 ease-(--ease-out)"
                  style={{ width, background: CHANNEL_COLORS.INSTAGRAM }}
                />
              </div>
            </li>
          );
        })}
      </ol>
      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-(--line) pt-4">
        <div>
          <dt className="t-meta text-muted">Tashrifdan kursgacha</dt>
          <dd className="font-display text-ink mt-1 text-lg leading-none font-semibold">{formatRate(rate(funnel.enrolled, funnel.visits), funnel.visits)}</dd>
        </div>
        <div>
          <dt className="t-meta text-muted">Bogʻlanilmagan</dt>
          <dd className="font-display text-ink mt-1 text-lg leading-none font-semibold">{formatCount(waiting)}</dd>
        </div>
      </dl>
      {waiting > 0 ? (
        <Link
          href="/admin/leads?channel=INSTAGRAM&status=NEW"
          className="bg-orange-soft text-orange-deep hover:bg-orange/15 mt-4 flex items-center justify-between gap-3 rounded-[10px] px-3.5 py-2.5 text-[13px] font-semibold transition-colors"
        >
          <span>{formatCount(waiting)} ta Instagram arizasi javob kutmoqda</span>
          <ArrowRight size={15} aria-hidden className="shrink-0" />
        </Link>
      ) : null}
    </div>
  );
}
