"use client";

import { Check, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  label: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  className?: string;
}

/**
 * Custom select in the site's design language: a field-like trigger and a frosted glass listbox.
 * Fully keyboard accessible (arrows, Home/End, type-ahead, Enter/Space, Esc) with ARIA listbox semantics.
 */
export function Select({ label, options, value, onChange, placeholder, error, hint, required, disabled, name, className }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: "", at: 0 });
  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  const close = useCallback(() => {
    setOpen(false);
    setActiveIndex(-1);
  }, []);

  const openList = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
  }, [disabled, options, value]);

  const commit = useCallback(
    (index: number) => {
      const o = options[index];
      if (!o) return;
      onChange(o.value);
      close();
      root.current?.querySelector<HTMLButtonElement>("button")?.focus();
    },
    [options, onChange, close],
  );

  // Outside click / escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, close]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    list.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) return openList();
        setActiveIndex((i) => Math.min(options.length - 1, i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) return openList();
        setActiveIndex((i) => Math.max(0, i - 1));
        break;
      case "Home":
        if (open) {
          e.preventDefault();
          setActiveIndex(0);
        }
        break;
      case "End":
        if (open) {
          e.preventDefault();
          setActiveIndex(options.length - 1);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) return openList();
        commit(activeIndex);
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          close();
        }
        break;
      case "Tab":
        if (open) close();
        break;
      default: {
        if (e.key.length !== 1) return;
        const now = Date.now();
        const t = typeahead.current;
        t.text = now - t.at < 700 ? t.text + e.key.toLowerCase() : e.key.toLowerCase();
        t.at = now;
        const idx = options.findIndex((o) => o.label.toLowerCase().startsWith(t.text));
        if (idx >= 0) {
          if (open) setActiveIndex(idx);
          else onChange(options[idx].value);
        }
      }
    }
  };

  const listId = `${id}-list`;
  const labelId = `${id}-label`;

  return (
    <div ref={root} className={cn("relative space-y-1.5", className)}>
      <span id={labelId} className="t-caption block text-(--fg) media-world:text-white/85">
        {label}
        {required ? <span className="ml-0.5 text-orange" aria-hidden>*</span> : null}
      </span>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${labelId} ${id}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-(--radius-md) border border-(--line) bg-(--surface) px-4 text-left text-base text-(--fg) transition-[border-color,box-shadow,background-color] duration-200 focus:border-orange focus:outline-none focus:ring-4 focus:ring-orange/15 disabled:opacity-60",
          "media-world:border-white/15 media-world:bg-white/[0.06] media-world:text-white media-world:focus:border-orange",
          open && "border-orange ring-4 ring-orange/15",
          error && "border-danger ring-danger/15",
        )}
      >
        <span className={cn("truncate", !selected && "text-(--fg-muted)/80 media-world:text-white/45")}>{selected?.label ?? placeholder ?? "—"}</span>
        <ChevronDown size={18} className={cn("shrink-0 text-(--fg-muted) transition-transform duration-300 ease-[var(--ease-out)] media-world:text-white/60", open && "rotate-180 text-orange")} aria-hidden />
      </button>

      <ul
        id={listId}
        ref={list}
        role="listbox"
        aria-labelledby={labelId}
        tabIndex={-1}
        hidden={!open}
        className={cn(
          "glass absolute top-full left-0 z-30 mt-2 max-h-64 w-full overflow-auto rounded-(--radius-lg) p-1.5 shadow-lg",
          "[--glass-bg:rgba(255,255,255,.9)] media-world:[--glass-bg:rgba(24,24,26,.92)] media-world:[--glass-border:rgba(255,255,255,.14)]",
          open && "animate-[select-in_.22s_var(--ease-out)]",
        )}
      >
        {options.map((o, i) => {
          const isSel = o.value === value;
          const isActive = i === activeIndex;
          return (
            <li
              key={o.value}
              role="option"
              aria-selected={isSel}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit(i)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-[15px] transition-colors duration-150",
                isActive && "bg-orange-soft text-ink media-world:bg-white/10 media-world:text-white",
                isSel && "font-semibold",
              )}
            >
              <span className="truncate">{o.label}</span>
              {isSel ? <Check size={16} className="shrink-0 text-orange" aria-hidden /> : null}
            </li>
          );
        })}
      </ul>

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-sm text-(--fg-muted)">
          {hint}
        </p>
      ) : null}
      <style>{`@keyframes select-in{from{opacity:0;transform:translateY(-6px) scale(.98)}to{opacity:1;transform:none}}`}</style>
    </div>
  );
}
