"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { LeadStatus, LeadType } from "@prisma/client";
import { LEAD_STATUS_LABELS, LEAD_TYPE_LABELS } from "@/components/admin/labels";
import { LEAD_STATUS_COLORS } from "@/components/admin/ui/status-badge";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { BarChart3 } from "lucide-react";

/** Brand palette: identity is carried by fixed hue order + legend + direct labels, never colour alone. */
export const TYPE_COLORS: Record<LeadType, string> = { EDUCATION: "#FE7E03", MEDIA: "#111111", GENERAL: "#737373" };
const TYPE_ORDER: LeadType[] = ["EDUCATION", "MEDIA", "GENERAL"];
const MUTED = "#737373";
const LINE = "rgba(17,17,17,0.08)";

export interface SeriesPoint {
  day: string;
  EDUCATION: number;
  MEDIA: number;
  GENERAL: number;
}

const fmtDay = (iso: string) => {
  const d = new Date(`${iso}T00:00:00`);
  return new Intl.DateTimeFormat("uz-UZ", { day: "2-digit", month: "2-digit" }).format(d);
};

function TooltipCard({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const rows = [...payload].reverse();
  return (
    <div className="rounded-[10px] border border-(--line) bg-paper px-3 py-2 text-xs shadow-md">
      <p className="t-meta mb-1.5 text-muted">{typeof label === "string" && /^\d{4}-\d{2}-\d{2}$/.test(label) ? fmtDay(label) : label}</p>
      <ul className="space-y-1">
        {rows.map((r) => (
          <li key={String(r.dataKey)} className="flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1.5 text-ink">
              <span aria-hidden className="size-2 rounded-full" style={{ background: r.color ?? MUTED }} />
              {typeof r.name === "string" ? r.name : String(r.dataKey)}
            </span>
            <span className="font-semibold text-ink tabular-nums">{String(r.value ?? 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Belgilar">
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-1.5 text-xs text-muted">
          <span aria-hidden className="size-2 rounded-full" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export function LeadsOverTimeChart({ data }: { data: SeriesPoint[] }) {
  const total = data.reduce((s, d) => s + d.EDUCATION + d.MEDIA + d.GENERAL, 0);
  if (!total) return <EmptyState compact icon={<BarChart3 />} title="Bu davrda lidlar yoʻq" description="Yangi murojaatlar kelganda grafik shu yerda paydo boʻladi." />;
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Legend items={TYPE_ORDER.map((t) => ({ label: LEAD_TYPE_LABELS[t], color: TYPE_COLORS[t] }))} />
        <p className="t-meta text-muted">jami {total}</p>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={LINE} />
            <XAxis dataKey="day" tickFormatter={fmtDay} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={{ stroke: LINE }} minTickGap={24} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} width={44} />
            <Tooltip content={TooltipCard} cursor={{ stroke: LINE }} />
            {TYPE_ORDER.map((t) => (
              <Area key={t} type="monotone" dataKey={t} name={LEAD_TYPE_LABELS[t]} stackId="1" stroke={TYPE_COLORS[t]} strokeWidth={2} fill={TYPE_COLORS[t]} fillOpacity={0.18} isAnimationActive={false} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TopBarChart({ data, emptyTitle }: { data: { title: string; count: number }[]; emptyTitle: string }) {
  if (!data.length) return <EmptyState compact icon={<BarChart3 />} title={emptyTitle} />;
  const height = Math.max(120, data.length * 40);
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }} barCategoryGap={8}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="title" width={140} tick={{ fontSize: 12, fill: "#111111" }} tickLine={false} axisLine={false} />
          <Tooltip content={TooltipCard} cursor={{ fill: "rgba(17,17,17,0.03)" }} />
          <Bar dataKey="count" name="Lidlar" fill="#FE7E03" radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={false} label={{ position: "right", fontSize: 12, fill: "#111111" }} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const FUNNEL: LeadStatus[] = ["NEW", "CONTACTED", "IN_PROGRESS", "CONVERTED"];

export function StatusFunnel({ byStatus }: { byStatus: Partial<Record<LeadStatus, number>> }) {
  const total = Object.values(byStatus).reduce((s, n) => s + (n ?? 0), 0);
  if (!total) return <EmptyState compact icon={<BarChart3 />} title="Hali lidlar yoʻq" />;
  const max = Math.max(1, ...FUNNEL.map((s) => byStatus[s] ?? 0));
  const lost = byStatus.LOST ?? 0;
  return (
    <div>
      <ol className="space-y-2.5">
        {FUNNEL.map((s) => {
          const n = byStatus[s] ?? 0;
          const width = `${Math.max(4, Math.round((n / max) * 100))}%`;
          return (
            <li key={s} className="grid grid-cols-[110px_1fr_40px] items-center gap-3 text-sm">
              <span className="truncate text-ink">{LEAD_STATUS_LABELS[s]}</span>
              <div className="h-5 rounded-[4px] bg-paper-3">
                <div className="h-full rounded-[4px] transition-[width] duration-500 ease-(--ease-out)" style={{ width, background: LEAD_STATUS_COLORS[s] }} aria-hidden />
              </div>
              <span className="text-right font-semibold text-ink tabular-nums">{n}</span>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex items-center justify-between border-t border-(--line) pt-3 text-sm">
        <span className="inline-flex items-center gap-1.5 text-muted">
          <span aria-hidden className="size-2 rounded-full" style={{ background: LEAD_STATUS_COLORS.LOST }} />
          {LEAD_STATUS_LABELS.LOST}
        </span>
        <span className="font-semibold text-ink tabular-nums">{lost}</span>
      </div>
    </div>
  );
}

export function TypeBreakdownChart({ byType }: { byType: Partial<Record<LeadType, number>> }) {
  const data = TYPE_ORDER.map((t) => ({ type: t, label: LEAD_TYPE_LABELS[t], count: byType[t] ?? 0 }));
  const total = data.reduce((s, d) => s + d.count, 0);
  if (!total) return null;
  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 32, left: 0, bottom: 0 }} barCategoryGap={4}>
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="label" width={60} tick={{ fontSize: 11, fill: MUTED }} tickLine={false} axisLine={false} />
          <Tooltip content={TooltipCard} cursor={{ fill: "rgba(17,17,17,0.03)" }} />
          <Bar dataKey="count" name="Lidlar" radius={[0, 4, 4, 0]} barSize={12} isAnimationActive={false} label={{ position: "right", fontSize: 11, fill: "#111111" }}>
            {data.map((d) => (
              <Cell key={d.type} fill={TYPE_COLORS[d.type]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
