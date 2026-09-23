import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface Kpi {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
  icon?: ReactNode;
}

export function KpiCards({ items }: { items: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {items.map((k) => (
        <div key={k.label} className={cn("rounded-(--radius-md) border border-(--line) bg-paper p-4 shadow-sm", k.accent && "border-orange/30 bg-orange-soft/60")}>
          <div className="flex items-center justify-between gap-2">
            <p className="t-eyebrow text-[10px] text-muted">{k.label}</p>
            {k.icon ? <span className="text-muted [&>svg]:size-4">{k.icon}</span> : null}
          </div>
          <p className="mt-3 font-display text-[1.75rem] leading-none font-semibold tracking-[-0.03em] text-ink tabular-nums">{k.value}</p>
          {k.hint ? <p className="t-meta mt-2 text-muted">{k.hint}</p> : null}
        </div>
      ))}
    </div>
  );
}
