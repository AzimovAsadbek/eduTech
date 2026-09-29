"use client";

import { Check, ChevronDown } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import { controlBase } from "./field";

export interface MenuOption {
  value: string;
  label: string;
  /** Colour dot before the label (e.g. a marketing channel). */
  dot?: string;
  /** Options sharing a group are listed under a small heading. */
  group?: string;
}

export interface SelectMenuProps {
  value: string;
  onChange: (value: string) => void;
  options: MenuOption[];
  /** Accessible name; rendered visibly above the trigger unless `hideLabel`. */
  label: string;
  hideLabel?: boolean;
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  size?: "sm" | "md";
}

/**
 * Admin-styled select with a custom listbox, for when options need more than text (colour dots, groups).
 * Keyboard: ↑/↓, Home/End, type-ahead, Enter/Space to pick, Esc/Tab to close. Focus stays on the trigger
 * (aria-activedescendant), so screen readers announce the active option.
 */
export function SelectMenu({
  value,
  onChange,
  options,
  label,
  hideLabel,
  placeholder = "—",
  id,
  disabled,
  className,
  triggerClassName,
  size = "md",
}: SelectMenuProps) {
  const auto = useId();
  const baseId = id ?? auto;
  const listId = `${baseId}-list`;
  const labelId = `${baseId}-label`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [alignRight, setAlignRight] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typeahead = useRef({ text: "", at: 0 });
  const selected = useMemo(() => options.find((o) => o.value === value) ?? null, [options, value]);

  const close = useCallback(() => {
    setOpen(false);
    setActive(-1);
  }, []);

  const openList = useCallback(() => {
    if (disabled) return;
    // Open towards the side with room so the menu never widens the page on phones.
    const rect = root.current?.getBoundingClientRect();
    setAlignRight(Boolean(rect && rect.left > window.innerWidth / 2));
    setActive(
      Math.max(
        0,
        options.findIndex((o) => o.value === value),
      ),
    );
    setOpen(true);
  }, [disabled, options, value]);

  const commit = useCallback(
    (index: number) => {
      const o = options[index];
      if (!o) return;
      close();
      trigger.current?.focus();
      if (o.value !== value) onChange(o.value);
    },
    [options, value, onChange, close],
  );

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open, close]);

  useEffect(() => {
    if (!open || active < 0) return;
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) return openList();
        setActive((i) => Math.min(options.length - 1, i + 1));
        return;
      case "ArrowUp":
        e.preventDefault();
        if (!open) return openList();
        setActive((i) => Math.max(0, i - 1));
        return;
      case "Home":
        if (open) {
          e.preventDefault();
          setActive(0);
        }
        return;
      case "End":
        if (open) {
          e.preventDefault();
          setActive(options.length - 1);
        }
        return;
      case "Enter":
      case " ":
        e.preventDefault();
        if (!open) return openList();
        commit(active);
        return;
      case "Escape":
        if (open) {
          e.preventDefault();
          close();
        }
        return;
      case "Tab":
        if (open) close();
        return;
      default: {
        if (e.key.length !== 1 || e.metaKey || e.ctrlKey || e.altKey) return;
        const now = Date.now();
        const t = typeahead.current;
        t.text = now - t.at < 700 ? t.text + e.key.toLowerCase() : e.key.toLowerCase();
        t.at = now;
        const idx = options.findIndex((o) => o.label.toLowerCase().startsWith(t.text));
        if (idx < 0) return;
        if (open) setActive(idx);
        else if (options[idx].value !== value) onChange(options[idx].value);
      }
    }
  };

  const optionId = (i: number) => `${baseId}-opt-${i}`;

  return (
    <div ref={root} className={cn("relative", className)}>
      <span id={labelId} className={hideLabel ? "sr-only" : "text-ink mb-1.5 block text-[13px] font-semibold"}>
        {label}
      </span>
      <button
        ref={trigger}
        type="button"
        id={baseId}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-labelledby={`${labelId} ${baseId}`}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        className={cn(
          controlBase,
          "flex items-center justify-between gap-2 text-left",
          size === "sm" ? "h-9 text-[13px]" : "h-10",
          open && "border-orange ring-orange/15 ring-3",
          triggerClassName,
        )}
      >
        <span className={cn("flex min-w-0 items-center gap-2", !selected && "text-muted")}>
          {selected?.dot ? <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: selected.dot }} /> : null}
          <span className="truncate">{selected?.label ?? placeholder}</span>
        </span>
        <ChevronDown size={16} aria-hidden className={cn("text-muted shrink-0 transition-transform duration-200", open && "text-orange rotate-180")} />
      </button>

      <ul
        ref={list}
        id={listId}
        role="listbox"
        aria-labelledby={labelId}
        tabIndex={-1}
        hidden={!open}
        className={cn(
          "bg-paper absolute top-full z-40 mt-1.5 max-h-72 w-max max-w-[min(20rem,calc(100vw-2rem))] min-w-full overflow-auto rounded-(--radius-md) border border-(--line) p-1 shadow-md",
          alignRight ? "right-0" : "left-0",
        )}
      >
        {options.flatMap((o, i) => {
          const isSelected = o.value === value;
          // Group headings are visual only; option labels stay self-explanatory for screen readers.
          const heading =
            o.group && o.group !== options[i - 1]?.group ? (
              <li key={`group:${o.group}`} role="presentation" aria-hidden className="t-eyebrow text-muted px-2.5 pt-2.5 pb-1 text-[10px]">
                {o.group}
              </li>
            ) : null;
          const option = (
            <li
              key={o.value}
              id={optionId(i)}
              role="option"
              aria-selected={isSelected}
              data-index={i}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => commit(i)}
              className={cn(
                "text-ink flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-[13px]",
                i === active && "bg-paper-3",
                isSelected && "font-semibold",
              )}
            >
              {o.dot ? <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: o.dot }} /> : null}
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              {isSelected ? <Check size={14} aria-hidden className="text-orange shrink-0" /> : null}
            </li>
          );
          return heading ? [heading, option] : [option];
        })}
      </ul>
    </div>
  );
}
