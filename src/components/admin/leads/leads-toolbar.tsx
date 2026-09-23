"use client";

import { Download, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER, LEAD_TYPE_LABELS } from "@/components/admin/labels";
import { Button } from "@/components/admin/ui/button";
import { controlBase, selectChrome } from "@/components/admin/ui/field";
import { cn } from "@/lib/utils";
import { exportQueryFromSearch } from "./filters";

const SORTS = [
  { value: "createdAt:desc", label: "Yangi → eski" },
  { value: "createdAt:asc", label: "Eski → yangi" },
  { value: "updatedAt:desc", label: "Oxirgi oʻzgarish" },
  { value: "name:asc", label: "Ism A→Z" },
  { value: "status:asc", label: "Holat" },
];

export function LeadsToolbar({ total }: { total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();
  const urlQ = sp.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  const [prevUrlQ, setPrevUrlQ] = useState(urlQ);
  if (urlQ !== prevUrlQ) {
    // Re-sync the draft when the URL changes (back/forward, global search).
    setPrevUrlQ(urlQ);
    setQ(urlQ);
  }

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    next.delete("page");
    start(() => router.push(`${pathname}${next.toString() ? `?${next}` : ""}`));
  };

  const type = sp.get("type") ?? "";
  const status = sp.get("status") ?? "";
  const from = sp.get("from") ?? "";
  const to = sp.get("to") ?? "";
  const sort = `${sp.get("sort") ?? "createdAt"}:${sp.get("dir") ?? "desc"}`;
  const hasFilters = Boolean(sp.get("q") || type || status || from || to);

  const select = cn(controlBase, selectChrome, "h-9 w-auto min-w-0 text-[13px]");

  return (
    <div className="flex flex-col gap-3 border-b border-(--line) px-4 py-3" aria-busy={pending}>
      <div className="flex flex-wrap items-center gap-2">
        <form
          role="search"
          className="relative min-w-[220px] flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            set({ q: q.trim() });
          }}
        >
          <label htmlFor="leads-q" className="sr-only">
            Qidirish
          </label>
          <Search size={15} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" aria-hidden />
          <input id="leads-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ism, telefon, kompaniya, email…" className={cn(controlBase, "h-9 pl-9 text-[13px]")} />
        </form>

        <label className="sr-only" htmlFor="leads-type">
          Turi
        </label>
        <select id="leads-type" value={type} onChange={(e) => set({ type: e.target.value })} className={select}>
          <option value="">Barcha turlar</option>
          {(Object.keys(LEAD_TYPE_LABELS) as (keyof typeof LEAD_TYPE_LABELS)[]).map((t) => (
            <option key={t} value={t}>
              {LEAD_TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="leads-status">
          Holat
        </label>
        <select id="leads-status" value={status} onChange={(e) => set({ status: e.target.value })} className={select}>
          <option value="">Barcha holatlar</option>
          {LEAD_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {LEAD_STATUS_LABELS[s]}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="leads-from">
          Boshlanish sanasi
        </label>
        <input id="leads-from" type="date" value={from} max={to || undefined} onChange={(e) => set({ from: e.target.value })} className={cn(controlBase, "h-9 w-auto text-[13px]")} />
        <span className="t-meta text-muted" aria-hidden>
          –
        </span>
        <label className="sr-only" htmlFor="leads-to">
          Tugash sanasi
        </label>
        <input id="leads-to" type="date" value={to} min={from || undefined} onChange={(e) => set({ to: e.target.value })} className={cn(controlBase, "h-9 w-auto text-[13px]")} />

        <label className="sr-only" htmlFor="leads-sort">
          Saralash
        </label>
        <select
          id="leads-sort"
          value={sort}
          onChange={(e) => {
            const [s, d] = e.target.value.split(":");
            set({ sort: s, dir: d });
          }}
          className={select}
        >
          {SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-2">
          {hasFilters ? (
            <Button variant="ghost" size="sm" icon={<X />} onClick={() => start(() => router.push(pathname))}>
              Tozalash
            </Button>
          ) : null}
          <Button variant="outline" size="sm" icon={<Download />} href={`/api/v1/admin/leads/export${exportQueryFromSearch(sp)}`}>
            Excel export
          </Button>
        </div>
      </div>
      <p className="t-meta text-muted">
        {total} ta lid{hasFilters ? " (filtrlangan)" : ""}
      </p>
    </div>
  );
}
