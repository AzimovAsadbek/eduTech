"use client";

import { ChartLine } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { CHANNEL_COLORS } from "@/lib/channels";
import type { DailyPoint } from "@/server/modules/analytics/types";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { formatCount, formatDayKey } from "./format";

const MUTED = "#737373";
const GRID = "rgba(17,17,17,0.08)";
const SERIES = {
  visits: { label: "Tashriflar", color: "#525252" },
  leads: { label: "Arizalar", color: CHANNEL_COLORS.INSTAGRAM },
} as const;
type SeriesKey = keyof typeof SERIES;

/** One readout for both small multiples: values lead, labels follow, keyed by a short line in the series colour. */
function TrendTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  const point = active && payload?.length ? (payload[0].payload as DailyPoint) : null;
  if (!point) return null;
  return (
    <div className="bg-paper rounded-[10px] border border-(--line) px-3 py-2 text-xs shadow-md">
      <p className="t-meta text-muted mb-1.5">{formatDayKey(point.day)}</p>
      <ul className="space-y-1">
        {(Object.keys(SERIES) as SeriesKey[]).map((k) => (
          <li key={k} className="flex items-center justify-between gap-5">
            <span className="text-muted inline-flex items-center gap-1.5">
              <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: SERIES[k].color }} />
              {SERIES[k].label}
            </span>
            <span className="text-ink font-semibold tabular-nums">{formatCount(point[k])}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const hideTooltip = () => null;

function MiniArea({ data, k, withAxis }: { data: DailyPoint[]; k: SeriesKey; withAxis: boolean }) {
  const { label, color } = SERIES[k];
  const total = data.reduce((s, d) => s + d[k], 0);
  return (
    <figure className="min-w-0">
      <figcaption className="mb-1 flex items-baseline justify-between gap-3">
        <span className="text-ink inline-flex items-center gap-1.5 text-[13px] font-semibold">
          <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: color }} />
          {label}
        </span>
        <span className="t-meta text-muted">jami {formatCount(total)}</span>
      </figcaption>
      {/* Height includes the x-axis band on the bottom chart, so the card never scrolls inside. */}
      <div className={withAxis ? "h-[136px] w-full" : "h-[104px] w-full"}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} syncId="ig-trend" margin={{ top: 6, right: 8, left: -14, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis
              dataKey="day"
              hide={!withAxis}
              tickFormatter={formatDayKey}
              tick={{ fontSize: 11, fill: MUTED }}
              tickLine={false}
              axisLine={{ stroke: GRID }}
              minTickGap={28}
              interval="preserveStartEnd"
            />
            <YAxis allowDecimals={false} tickCount={3} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} width={40} />
            <Tooltip content={withAxis ? TrendTooltip : hideTooltip} cursor={{ stroke: "rgba(17,17,17,0.25)" }} />
            <Area
              type="monotone"
              dataKey={k}
              name={label}
              stroke={color}
              strokeWidth={2}
              fill={color}
              fillOpacity={0.1}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#ffffff", fill: color }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}

/**
 * Instagram visits and leads per day as two small multiples on a shared time axis
 * (their scales differ by orders of magnitude, so they never share one y-axis).
 */
export function InstagramTrend({ data }: { data: DailyPoint[] }) {
  const any = data.some((d) => d.visits || d.leads);
  if (!any) {
    return (
      <EmptyState
        compact
        icon={<ChartLine />}
        title="Bu davrda Instagram trafigi yoʻq"
        description="Instagramdan tashrif va arizalar kelganda kunlik grafik shu yerda paydo boʻladi."
      />
    );
  }
  return (
    <div className="space-y-3">
      <MiniArea data={data} k="visits" withAxis={false} />
      <MiniArea data={data} k="leads" withAxis />
      <details className="group border-t border-(--line) pt-3">
        <summary className="t-meta text-muted hover:text-ink cursor-pointer select-none">Jadval koʻrinishi</summary>
        <div className="mt-2 max-h-56 overflow-auto rounded-[10px] border border-(--line)">
          <table className="w-full text-[13px]">
            <thead className="bg-paper-2 sticky top-0">
              <tr className="t-eyebrow text-muted text-[10px]">
                <th scope="col" className="px-3 py-2 text-left font-medium">
                  Kun
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Tashriflar
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Arizalar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--line)">
              {[...data].reverse().map((d) => (
                <tr key={d.day}>
                  <td className="text-muted px-3 py-1.5 tabular-nums">{formatDayKey(d.day)}</td>
                  <td className="text-ink px-3 py-1.5 text-right tabular-nums">{formatCount(d.visits)}</td>
                  <td className="text-ink px-3 py-1.5 text-right tabular-nums">{formatCount(d.leads)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
