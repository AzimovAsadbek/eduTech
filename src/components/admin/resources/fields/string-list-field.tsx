"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useId, useState } from "react";
import { controlBase, FieldWrap } from "@/components/admin/ui/field";
import { Button } from "@/components/admin/ui/button";
import { cn } from "@/lib/utils";

export function StringListField({
  label,
  value,
  onChange,
  hint,
  error,
  placeholder,
  required,
  compact,
}: {
  label?: string;
  value: string[];
  onChange: (v: string[]) => void;
  hint?: string;
  error?: string;
  placeholder?: string;
  required?: boolean;
  compact?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const id = useId();

  const add = () => {
    const s = draft.trim();
    if (!s) return;
    onChange([...value, s]);
    setDraft("");
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const edit = (i: number, s: string) => {
    const next = [...value];
    next[i] = s;
    onChange(next);
  };

  return (
    <FieldWrap id={id} label={label} hint={hint} error={error} required={required} as="div">
      <div className={cn("rounded-[10px] border border-(--line-strong) bg-paper", compact ? "p-1.5" : "p-2")}>
        {value.length ? (
          <ul className="mb-2 space-y-1" aria-label={label}>
            {value.map((item, i) => (
              <li key={i} className="group flex items-center gap-1">
                <span className="t-meta w-6 shrink-0 text-center text-muted-2">{i + 1}</span>
                <input value={item} onChange={(e) => edit(i, e.target.value)} aria-label={`${label ?? "Element"} ${i + 1}`} className={cn(controlBase, "h-8 border-transparent bg-paper-2 text-[13px] focus:bg-paper")} />
                <span className="flex shrink-0 items-center">
                  <Button variant="ghost" size="xs" iconOnly icon={<ArrowUp />} disabled={i === 0} onClick={() => move(i, -1)}>
                    Yuqoriga
                  </Button>
                  <Button variant="ghost" size="xs" iconOnly icon={<ArrowDown />} disabled={i === value.length - 1} onClick={() => move(i, 1)}>
                    Pastga
                  </Button>
                  <Button variant="ghost" size="xs" iconOnly icon={<X />} className="text-muted hover:text-danger" onClick={() => onChange(value.filter((_, j) => j !== i))}>
                    Oʻchirish
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex gap-1.5">
          <input
            id={id}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder={placeholder ?? "Yangi element… (Enter)"}
            className={cn(controlBase, "h-8 text-[13px]")}
          />
          <Button variant="outline" size="xs" icon={<Plus />} onClick={add} disabled={!draft.trim()}>
            Qoʻshish
          </Button>
        </div>
      </div>
    </FieldWrap>
  );
}
