"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, localeNames, localeShort, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface Props {
  /** White-on-dark styling for inverted headers, the mobile drawer and media-world sections. */
  inverted?: boolean;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Compact glass pill (UZ · RU · EN). Swaps the locale prefix while keeping the current route,
 * so the visitor stays on the same page.
 */
export function LanguageSwitcher({ inverted, size = "sm", className }: Props) {
  const t = useTranslations("common.language");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // The root layout (which owns <html lang>) sits above the [locale] segment and is not re-rendered
  // on a soft navigation, so keep the document language in sync after a client-side switch.
  useEffect(() => {
    if (document.documentElement.lang !== locale) document.documentElement.lang = locale;
  }, [locale]);

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    // `pathname` is the current route without its locale prefix (e.g. /kurslar/dasturlash),
    // so replacing it under another locale keeps the visitor on the same page.
    startTransition(() => router.replace(pathname, { locale: next }));
  };

  return (
    <div
      role="group"
      aria-label={t("label")}
      data-pending={pending ? "" : undefined}
      className={cn(
        "glass inline-flex shrink-0 items-center gap-0.5 rounded-full p-1 transition-[background-color,border-color,opacity] duration-300 data-[pending]:opacity-70",
        inverted && "[--glass-bg:rgba(255,255,255,.08)] [--glass-border:rgba(255,255,255,.14)] [--shadow-glass:0_8px_32px_rgba(0,0,0,.25),inset_0_1px_0_rgba(255,255,255,.08)]",
        className,
      )}
    >
      {locales.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            lang={l}
            onClick={() => switchTo(l)}
            aria-current={active ? "true" : undefined}
            aria-label={localeNames[l]}
            title={localeNames[l]}
            disabled={pending}
            className={cn(
              "rounded-full font-semibold tracking-[0.06em] uppercase transition-[background-color,color,box-shadow] duration-300 ease-[var(--ease-out)] focus-visible:ring-2 focus-visible:ring-orange/40 focus-visible:outline-none",
              size === "sm" ? "h-7 px-2.5 text-[11px]" : "h-9 px-3.5 text-xs",
              active
                ? "bg-orange text-white shadow-[0_4px_14px_-6px_rgba(255,107,26,.7)]"
                : inverted
                  ? "text-white/70 hover:bg-white/10 hover:text-white"
                  : "text-ink/65 hover:bg-ink/[0.06] hover:text-ink",
            )}
          >
            {localeShort[l]}
          </button>
        );
      })}
    </div>
  );
}
