"use client";

import { Check, ChevronDown, LoaderCircle } from "lucide-react";
import { hasLocale, useLocale, useTranslations } from "next-intl";
import { useEffect, useId, useLayoutEffect, useOptimistic, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { LocaleFlag } from "@/components/brand/flags";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeNames, localeShort, locales, routing, type Locale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface Props {
  /** White-on-dark styling for inverted headers, the mobile drawer and media-world sections. */
  inverted?: boolean;
  /** `sm`: flag and code (desktop header). `md`: flag and native name (mobile drawer). */
  size?: "sm" | "md";
  className?: string;
}

/** The menu stays mounted while "open" and during its exit transition ("closing"). */
type Phase = "closed" | "open" | "closing";
const EXIT_MS = 150;
/** Minimum distance in px between the menu and the viewport edges. */
const EDGE = 8;

const menuItems = (menu: HTMLElement) => Array.from(menu.querySelectorAll<HTMLElement>('[role="menuitemradio"]'));

/**
 * Language select built on the WAI-ARIA menu button pattern: a glass pill with the current flag opens a
 * menu of languages. Switching swaps the locale prefix but keeps the route, so the visitor stays on the same page.
 */
export function LanguageSwitcher({ inverted, size = "sm", className }: Props) {
  const t = useTranslations("common.language");
  const active = useLocale();
  const locale: Locale = hasLocale(locales, active) ? active : routing.defaultLocale;
  const pathname = usePathname();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  // The chosen language shows in the trigger right away while its route loads.
  const [shown, setShown] = useOptimistic(locale);
  const [phase, setPhase] = useState<Phase>("closed");
  const focusIndex = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const open = phase === "open";
  const checkedIndex = locales.indexOf(shown);
  const lastIndex = locales.length - 1;

  // The root layout (which owns <html lang>) sits above the [locale] segment and is not re-rendered
  // on a soft navigation, so keep the document language in sync after a client-side switch.
  useEffect(() => {
    if (document.documentElement.lang !== locale) document.documentElement.lang = locale;
  }, [locale]);

  // Before the menu paints: open below the trigger, or above it when there is not enough room below;
  // align it to the trigger's end edge without crossing the viewport edges; then move focus into it.
  useLayoutEffect(() => {
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (phase !== "open" || !menu || !trigger) return;
    const rect = trigger.getBoundingClientRect();
    const below = window.innerHeight - rect.bottom;
    // Room needed: the menu, its 8px gap to the trigger and the edge margin.
    menu.dataset.side = below < menu.offsetHeight + 2 * EDGE && rect.top > below ? "top" : "bottom";
    const pastLeft = EDGE - (rect.right - menu.offsetWidth);
    const pastRight = rect.right - (document.documentElement.clientWidth - EDGE);
    menu.style.right = `${pastLeft > 0 ? -pastLeft : Math.max(0, pastRight)}px`;
    menuItems(menu)[focusIndex.current]?.focus({ preventScroll: true });
  }, [phase]);

  // Let the exit transition play, then unmount the menu.
  useEffect(() => {
    if (phase !== "closing") return;
    const timer = setTimeout(() => setPhase("closed"), EXIT_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  // A press anywhere outside closes the menu.
  useEffect(() => {
    if (phase !== "open") return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setPhase("closing");
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [phase]);

  const openAt = (index: number) => {
    focusIndex.current = index;
    setPhase("open");
  };

  const close = (refocus = true) => {
    setPhase((p) => (p === "open" ? "closing" : p));
    if (refocus) triggerRef.current?.focus();
  };

  const choose = (next: Locale) => {
    close();
    if (next === shown) return;
    // `pathname` is the current route without its locale prefix (e.g. /kurslar/dasturlash),
    // so replacing it under another locale keeps the visitor on the same page.
    startTransition(() => {
      setShown(next);
      router.replace(pathname, { locale: next });
    });
  };

  // Enter, Space and a click land on the current language (like a native select);
  // ArrowDown and ArrowUp land on the first and last item, as in the WAI-ARIA pattern.
  const onTriggerKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        if (open) close();
        else openAt(checkedIndex);
        break;
      case "ArrowDown":
        openAt(0);
        break;
      case "ArrowUp":
        openAt(lastIndex);
        break;
      case "Escape":
        if (!open) return;
        e.stopPropagation();
        close();
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const onMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = menuItems(e.currentTarget);
    const index = items.indexOf(document.activeElement as HTMLElement);
    const focusAt = (i: number) => items[(i + items.length) % items.length]?.focus();
    switch (e.key) {
      case "ArrowDown":
        focusAt(index + 1);
        break;
      case "ArrowUp":
        focusAt(index < 0 ? lastIndex : index - 1);
        break;
      case "Home":
        focusAt(0);
        break;
      case "End":
        focusAt(lastIndex);
        break;
      case "Enter":
      case " ":
        if (index >= 0) choose(locales[index]);
        break;
      case "Escape":
        // Close only this menu, not the mobile drawer around it.
        e.stopPropagation();
        close();
        break;
      case "Tab":
        // Leave as if the menu sat right after the trigger: Tab moves on from it, Shift+Tab lands on it.
        close();
        if (!e.shiftKey) return;
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  const name = `${t("label")}: ${localeNames[shown]}`;

  return (
    <div ref={rootRef} className={cn("relative inline-flex shrink-0", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        // The visible code stays part of the name for voice-control users (WCAG 2.5.3).
        aria-label={size === "sm" ? `${name} (${localeShort[shown]})` : name}
        aria-busy={pending || undefined}
        data-open={open ? "" : undefined}
        onClick={() => (open ? close() : openAt(checkedIndex))}
        onKeyDown={onTriggerKeyDown}
        // Firefox still clicks on Space keyup after keydown was prevented.
        onKeyUp={(e) => e.key === " " && e.preventDefault()}
        className={cn(
          "glass group/trigger inline-flex items-center rounded-full whitespace-nowrap select-none transition-[background-color,border-color,box-shadow] duration-300 ease-[var(--ease-out)]",
          size === "sm" ? "h-9 gap-2 pr-2.5 pl-2 text-xs font-semibold tracking-[0.06em]" : "h-11 gap-2.5 pr-3.5 pl-2.5 text-[15px] font-medium",
          inverted
            ? "text-white [--glass-bg:rgba(255,255,255,.08)] [--glass-border:rgba(255,255,255,.14)] [--shadow-glass:0_8px_32px_rgba(0,0,0,.25),inset_0_1px_0_rgba(255,255,255,.08)] hover:[--glass-bg:rgba(255,255,255,.14)] data-[open]:[--glass-bg:rgba(255,255,255,.16)]"
            : "text-ink [--glass-border:var(--color-line)] hover:[--glass-bg:rgba(255,255,255,.92)] data-[open]:[--glass-bg:#fff]",
        )}
      >
        <LocaleFlag locale={shown} size={size === "sm" ? 20 : 24} />
        <span lang={shown}>{size === "sm" ? localeShort[shown] : localeNames[shown]}</span>
        {pending ? (
          <LoaderCircle size={size === "sm" ? 14 : 16} strokeWidth={2.25} className="animate-spin text-orange" aria-hidden />
        ) : (
          <ChevronDown
            size={size === "sm" ? 14 : 16}
            strokeWidth={2.25}
            className={cn(
              "transition-[rotate,color] duration-300 ease-[var(--ease-out)] motion-reduce:transition-none",
              open ? "rotate-180 text-orange" : inverted ? "text-white/55 group-hover/trigger:text-white/85" : "text-ink/45 group-hover/trigger:text-ink/75",
            )}
            aria-hidden
          />
        )}
      </button>

      {phase !== "closed" ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={t("label")}
          tabIndex={-1}
          inert={!open}
          onKeyDown={onMenuKeyDown}
          className={cn(
            "absolute top-full right-0 z-50 mt-2 w-max max-w-[calc(100vw-1rem)] min-w-52 origin-top-right rounded-[20px] border p-1.5 outline-none",
            "data-[side=top]:top-auto data-[side=top]:bottom-full data-[side=top]:mt-0 data-[side=top]:mb-2 data-[side=top]:origin-bottom-right",
            "transition-[opacity,scale] duration-150 ease-[var(--ease-out)] motion-reduce:transition-none",
            open ? "scale-100 opacity-100 starting:scale-[.96] starting:opacity-0" : "pointer-events-none scale-[.96] opacity-0",
            inverted
              ? "border-white/[0.12] bg-[#1c1c1f] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.06),0_24px_56px_-12px_rgba(0,0,0,.7)]"
              : "border-ink/[0.07] bg-white text-ink shadow-[0_2px_6px_rgba(17,17,17,.04),0_18px_44px_-14px_rgba(17,17,17,.2)]",
          )}
        >
          {locales.map((l) => {
            const checked = l === shown;
            return (
              <button
                key={l}
                type="button"
                role="menuitemradio"
                aria-checked={checked}
                tabIndex={-1}
                onClick={() => choose(l)}
                className={cn(
                  "group/item flex h-11 w-full items-center gap-3 rounded-[14px] pr-3 pl-2.5 text-left text-[15px] outline-none transition-colors duration-150",
                  inverted
                    ? "text-white/75 hover:bg-orange/15 hover:text-white focus-visible:bg-orange/15 focus-visible:text-white"
                    : "text-ink/75 hover:bg-orange-soft hover:text-ink focus-visible:bg-orange-soft focus-visible:text-ink",
                  checked && (inverted ? "font-semibold text-white" : "font-semibold text-ink"),
                )}
              >
                <LocaleFlag locale={l} size={24} />
                <span lang={l} className="flex-1 truncate">
                  {localeNames[l]}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "font-mono text-[11px] font-medium tracking-[0.08em] transition-colors duration-150 group-hover/item:text-orange group-focus-visible/item:text-orange",
                    inverted ? "text-white/35" : "text-ink/35",
                  )}
                >
                  {localeShort[l]}
                </span>
                <Check size={16} strokeWidth={2.5} className={cn("shrink-0 text-orange", !checked && "invisible")} aria-hidden />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
