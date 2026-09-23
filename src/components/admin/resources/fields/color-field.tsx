"use client";

import { useId } from "react";
import { controlBase, FieldWrap } from "@/components/admin/ui/field";
import { cn } from "@/lib/utils";

const HEX = /^#[0-9a-fA-F]{6}$/;

export function ColorField({ label, value, onChange, error, hint }: { label: string; value: string; onChange: (v: string) => void; error?: string; hint?: string }) {
  const id = useId();
  const valid = HEX.test(value);
  return (
    <FieldWrap id={id} label={label} hint={hint} error={error}>
      <div className="flex items-center gap-2">
        <label className="relative grid size-10 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-[10px] border border-(--line-strong)" style={{ background: valid ? value : "transparent" }}>
          <span className="sr-only">Rang tanlash</span>
          <input type="color" value={valid ? value : "#FF6B1A"} onChange={(e) => onChange(e.target.value.toUpperCase())} className="absolute inset-0 size-full cursor-pointer opacity-0" tabIndex={-1} />
          {!valid ? <span aria-hidden className="size-4 rounded-full bg-[conic-gradient(from_0deg,#FF6B1A,#111,#FFF1E8,#FF6B1A)]" /> : null}
        </label>
        <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder="#FF6B1A" spellCheck={false} aria-invalid={error ? true : undefined} className={cn(controlBase, "h-10 font-mono text-[13px] uppercase")} />
        {value ? (
          <button type="button" onClick={() => onChange("")} className="t-meta shrink-0 text-muted hover:text-ink">
            tozalash
          </button>
        ) : null}
      </div>
    </FieldWrap>
  );
}
