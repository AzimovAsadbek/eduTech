import { InstagramGlyph } from "@/components/brand/social-icons";
import { rate } from "@/server/modules/analytics/metrics";
import type { ChannelAnalytics } from "@/server/modules/analytics/types";
import { cn } from "@/lib/utils";
import { INSTAGRAM_GRADIENT, INSTAGRAM_GRADIENT_H } from "./channel-badge";
import { formatCount, formatMinutes, formatPercent, formatRate } from "./format";

interface Cell {
  label: string;
  value: string;
  badge?: string | null;
  hint: string;
}

/** Instagram at a glance: visits, leads, lead %, enrolled (+ %), median response time. */
export function InstagramStrip({ data }: { data: ChannelAnalytics }) {
  const { funnel, leadRate, enrollRate, medianResponseMinutes } = data.instagram;
  const t = data.totals;
  const cells: Cell[] = [
    {
      label: "Tashriflar",
      value: formatCount(funnel.visits),
      hint: t.visits ? `umumiy ulushi ${formatPercent(rate(funnel.visits, t.visits))}` : "tashriflar hali yoʻq",
    },
    {
      label: "Arizalar",
      value: formatCount(funnel.leads),
      hint: t.leads ? `umumiy ulushi ${formatPercent(rate(funnel.leads, t.leads))}` : "arizalar hali yoʻq",
    },
    { label: "Ariza konversiyasi", value: formatRate(leadRate, funnel.visits), hint: "tashrif → ariza" },
    {
      label: "Kursga yozildi",
      value: formatCount(funnel.enrolled),
      badge: funnel.leads ? formatPercent(enrollRate) : null,
      hint: "ariza → kurs",
    },
    {
      label: "Javob vaqti",
      value: formatMinutes(medianResponseMinutes),
      hint: t.medianResponseMinutes !== null ? `median · umumiy ${formatMinutes(t.medianResponseMinutes)}` : "median, birinchi aloqagacha",
    },
  ];

  return (
    <div className="bg-paper relative overflow-hidden rounded-(--radius-md) border border-(--line) shadow-sm">
      <span aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: INSTAGRAM_GRADIENT_H }} />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 140% at 0% 0%, rgba(214,41,118,0.07), transparent 60%), radial-gradient(60% 120% at 100% 100%, rgba(79,91,213,0.05), transparent 65%)",
        }}
      />
      <div className="relative flex flex-col gap-5 p-5 xl:flex-row xl:items-center xl:gap-0 xl:py-6">
        <div className="flex items-center gap-3 xl:w-48 xl:shrink-0 xl:pr-5">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-[12px] text-white shadow-[0_8px_20px_-10px_rgba(214,41,118,.8)]"
            style={{ background: INSTAGRAM_GRADIENT }}
          >
            <InstagramGlyph size={22} />
          </span>
          <div className="min-w-0">
            <p className="font-display text-ink text-lg leading-tight font-semibold tracking-[-0.01em]">Instagram</p>
            <p className="t-meta text-muted mt-0.5">oxirgi {data.days} kun</p>
          </div>
        </div>
        <dl className="grid flex-1 grid-cols-2 gap-x-5 gap-y-5 border-t border-(--line) pt-5 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-0 xl:border-t-0 xl:pt-0">
          {cells.map((c, i) => (
            <div
              key={c.label}
              className={cn(
                "min-w-0 lg:border-l lg:border-(--line) lg:px-5",
                i === 0 && "lg:border-l-0 lg:pl-0 xl:border-l xl:pl-5",
                i === cells.length - 1 && "col-span-2 sm:col-span-1",
              )}
            >
              <dt className="t-eyebrow text-muted text-[10px]">{c.label}</dt>
              <dd className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-ink text-[1.625rem] leading-none font-semibold tracking-[-0.03em]">{c.value}</span>
                {c.badge ? (
                  <span className="rounded-full bg-[#D62976]/10 px-1.5 py-0.5 text-[11px] leading-none font-semibold text-[#A3175A]">{c.badge}</span>
                ) : null}
              </dd>
              <dd className="t-meta text-muted mt-1.5 leading-snug">{c.hint}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
