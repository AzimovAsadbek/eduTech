"use client";

import { cn } from "@/lib/utils";
import { LOCALE_LABELS, TRANSLATION_LOCALES, type FormLocale, type TranslationLocale } from "@/components/admin/resources/config";

export interface LocaleProgress {
  done: number;
  total: number;
}

/**
 * Oʻzbek | Русский | English pill for content editors.
 * The translated locales carry a "RU 6/14" completion badge; grey when nothing is translated yet.
 */
export function LanguageSwitch({
  value,
  onChange,
  progress,
  className,
}: {
  value: FormLocale;
  onChange: (v: FormLocale) => void;
  progress: Record<TranslationLocale, LocaleProgress>;
  className?: string;
}) {
  const options: FormLocale[] = ["uz", ...TRANSLATION_LOCALES];
  return (
    <div
      role="radiogroup"
      aria-label="Kontent tili"
      className={cn("glass inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full p-1", className)}
    >
      {options.map((locale) => {
        const active = locale === value;
        return (
          <button
            key={locale}
            type="button"
            role="radio"
            aria-checked={active}
            data-locale={locale}
            onClick={() => onChange(locale)}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap transition-[background-color,color,box-shadow] duration-150",
              active ? "bg-orange text-white shadow-[0_6px_16px_-8px_rgba(255,107,26,.7)]" : "text-muted hover:bg-ink/5 hover:text-ink",
            )}
          >
            {LOCALE_LABELS[locale]}
            {locale !== "uz" ? <ProgressBadge locale={locale} progress={progress[locale]} active={active} /> : null}
          </button>
        );
      })}
    </div>
  );
}

/** Compact "RU 6/14" chip; also used in list tables. */
export function ProgressBadge({
  locale,
  progress,
  active,
  className,
}: {
  locale: TranslationLocale;
  progress: LocaleProgress;
  active?: boolean;
  className?: string;
}) {
  const { done, total } = progress;
  const tone = active
    ? "bg-white/20 text-white"
    : done === 0 || total === 0
      ? "bg-paper-3 text-muted-2"
      : done >= total
        ? "bg-success/10 text-success"
        : "bg-orange-soft text-orange";
  return (
    <span
      className={cn("inline-flex h-5 items-center rounded-full px-1.5 font-mono text-[10px] font-bold tracking-wide tabular-nums", tone, className)}
      aria-label={`${locale.toUpperCase()}: ${done} / ${total} tarjima qilingan`}
    >
      {locale.toUpperCase()} {done}/{total}
    </span>
  );
}
