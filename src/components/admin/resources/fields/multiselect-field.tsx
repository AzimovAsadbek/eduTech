"use client";

import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { adminApi, errorMessage } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { FieldWrap } from "@/components/admin/ui/field";
import type { Option } from "../config";

interface RemoteItem {
  id: string;
  name?: string;
  title?: string;
}

export function MultiSelectField({ label, resource, value, onChange, error, hint }: { label: string; resource: string; value: string[]; onChange: (v: string[]) => void; error?: string; hint?: string }) {
  const [options, setOptions] = useState<Option[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    adminApi
      .get<RemoteItem[]>(`/content/${resource}`, { pageSize: 200 })
      .then(({ data }) => {
        if (alive) setOptions(data.map((d) => ({ value: d.id, label: d.name ?? d.title ?? d.id })));
      })
      .catch((e) => alive && setLoadError(errorMessage(e)));
    return () => {
      alive = false;
    };
  }, [resource]);

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);

  return (
    <FieldWrap label={label} hint={hint} error={error ?? loadError ?? undefined} as="div">
      <div role="group" aria-label={label} className="flex min-h-10 flex-wrap gap-1.5 rounded-[10px] border border-(--line-strong) bg-paper p-1.5">
        {options === null && !loadError ? <span className="t-meta px-2 py-1.5 text-muted">Yuklanmoqda…</span> : null}
        {options?.length === 0 ? <span className="t-meta px-2 py-1.5 text-muted">Hali element yoʻq</span> : null}
        {options?.map((o) => {
          const active = value.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => toggle(o.value)}
              className={cn(
                "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-semibold transition-colors",
                active ? "border-ink bg-ink text-white" : "border-(--line) bg-paper text-muted hover:border-ink hover:text-ink",
              )}
            >
              {active ? <Check size={12} aria-hidden /> : null}
              {o.label}
            </button>
          );
        })}
      </div>
    </FieldWrap>
  );
}
