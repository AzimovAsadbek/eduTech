"use client";

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/admin/ui/button";
import { FieldWrap, Input, Textarea } from "@/components/admin/ui/field";
import type { JsonShape } from "../config";
import { emptyJsonItem, JSON_SHAPES, type FieldErrors } from "../form-values";
import { StringListField } from "./string-list-field";

type Row = Record<string, unknown>;

export function JsonListField({ name, label, shape, value, onChange, errors, hint }: { name: string; label: string; shape: JsonShape; value: Row[]; onChange: (v: Row[]) => void; errors: FieldErrors; hint?: string }) {
  const def = JSON_SHAPES[shape];
  const update = (i: number, key: string, v: unknown) => {
    const next = value.map((row, j) => (j === i ? { ...row, [key]: v } : row));
    onChange(next);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <FieldWrap label={label} hint={hint} error={errors[name]} as="div">
      <div className="space-y-3">
        {value.map((row, i) => (
          <fieldset key={i} className="rounded-[10px] border border-(--line-strong) bg-paper-2/60 p-3">
            <legend className="sr-only">
              {def.itemLabel} {i + 1}
            </legend>
            <div className="mb-3 flex items-center justify-between">
              <span className="t-eyebrow text-[10px] text-muted">
                {def.itemLabel} {String(i + 1).padStart(2, "0")}
              </span>
              <span className="flex items-center">
                <Button variant="ghost" size="xs" iconOnly icon={<ArrowUp />} disabled={i === 0} onClick={() => move(i, -1)}>
                  Yuqoriga
                </Button>
                <Button variant="ghost" size="xs" iconOnly icon={<ArrowDown />} disabled={i === value.length - 1} onClick={() => move(i, 1)}>
                  Pastga
                </Button>
                <Button variant="ghost" size="xs" iconOnly icon={<Trash2 />} className="text-muted hover:text-danger" onClick={() => onChange(value.filter((_, j) => j !== i))}>
                  Oʻchirish
                </Button>
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {def.fields.map((f) => {
                const err = errors[`${name}.${i}.${f.key}`];
                const v = row[f.key];
                if (f.kind === "string-list") {
                  return (
                    <div key={f.key} className="sm:col-span-2">
                      <StringListField compact label={f.label} value={Array.isArray(v) ? (v as string[]) : []} onChange={(nv) => update(i, f.key, nv)} error={err} placeholder={f.placeholder} />
                    </div>
                  );
                }
                if (f.kind === "textarea") {
                  return <Textarea key={f.key} label={f.label} value={String(v ?? "")} onChange={(e) => update(i, f.key, e.target.value)} error={err} wrapClassName="sm:col-span-2" className="min-h-20" />;
                }
                return <Input key={f.key} label={f.label} value={String(v ?? "")} onChange={(e) => update(i, f.key, e.target.value)} error={err} placeholder={f.placeholder} wrapClassName={f.key === "step" ? "sm:col-span-2 sm:max-w-32" : undefined} />;
              })}
            </div>
          </fieldset>
        ))}
        <Button variant="outline" size="sm" icon={<Plus />} onClick={() => onChange([...value, emptyJsonItem(shape)])}>
          {def.itemLabel} qoʻshish
        </Button>
      </div>
    </FieldWrap>
  );
}
