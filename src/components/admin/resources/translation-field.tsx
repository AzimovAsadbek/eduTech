"use client";

import { Copy } from "lucide-react";
import { useMemo } from "react";
import { Button } from "@/components/admin/ui/button";
import type { FieldDef, TranslationLocale } from "./config";
import { FieldRenderer } from "./field-renderer";
import type { FieldErrors } from "./form-values";
import { cloneFormValue, describeOriginal, isFilled } from "./translations";

/**
 * One translatable field: the regular editor bound to `translations.<locale>.<field>`,
 * plus the Uzbek original as a reference line and a one-click "copy from Uzbek" action.
 */
export function TranslationField({
  field,
  locale,
  value,
  original,
  onChange,
  errors,
}: {
  field: FieldDef;
  locale: TranslationLocale;
  value: unknown;
  original: unknown;
  onChange: (v: unknown) => void;
  errors: FieldErrors;
}) {
  // Translations are never mandatory and the Uzbek hint is replaced by the reference line below.
  const def = useMemo<FieldDef>(() => ({ ...field, required: false, hint: undefined }), [field]);
  // Errors arrive keyed by the full path ("translations.ru.curriculum.0.title"); the renderer expects field-relative keys.
  const scoped = useMemo(() => {
    const prefix = `translations.${locale}.`;
    const out: FieldErrors = {};
    for (const [k, v] of Object.entries(errors)) if (k.startsWith(prefix)) out[k.slice(prefix.length)] = v;
    return out;
  }, [errors, locale]);
  const originalText = describeOriginal(field, original);
  const hasOriginal = isFilled(original);

  return (
    <div data-field={`translations.${locale}.${field.name}`} className="space-y-1.5">
      <FieldRenderer field={def} value={value} onChange={onChange} errors={scoped} relations={{}} />
      <div className="bg-paper-2 text-muted flex items-start gap-2 rounded-[8px] px-2.5 py-1.5 text-[12px] leading-relaxed">
        <span aria-hidden className="bg-paper-3 text-muted-2 mt-0.5 inline-flex h-4 shrink-0 items-center rounded px-1 font-mono text-[10px] font-bold">
          UZ
        </span>
        <span className="sr-only">Oʻzbekcha asl matn:</span>
        <span className="line-clamp-2 min-w-0 flex-1 break-words">{hasOriginal ? originalText : <span className="text-muted-2 italic">— boʻsh —</span>}</span>
        <Button
          variant="ghost"
          size="xs"
          icon={<Copy />}
          className="text-muted hover:text-orange -my-1 -mr-1 h-7 shrink-0 text-[12px]"
          disabled={!hasOriginal}
          onClick={() => onChange(cloneFormValue(original))}
        >
          Oʻzbekchadan nusxa olish
        </Button>
      </div>
    </div>
  );
}
