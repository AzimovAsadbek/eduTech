"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export function Switch({ checked, onChange, label, hint, disabled, className, id }: SwitchProps) {
  const auto = useId();
  const sid = id ?? auto;
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <button
        id={sid}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={hint ? `${sid}-hint` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-6 w-10 shrink-0 rounded-full border transition-colors duration-200 disabled:opacity-50",
          checked ? "border-orange bg-orange" : "border-(--line-strong) bg-paper-3",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute top-0.5 left-0.5 size-[18px] rounded-full bg-white shadow-sm transition-transform duration-200 ease-(--ease-out)",
            checked && "translate-x-4",
          )}
        />
      </button>
      {label ? (
        <label htmlFor={sid} className="cursor-pointer select-none">
          <span className="block text-sm font-semibold text-ink">{label}</span>
          {hint ? (
            <span id={`${sid}-hint`} className="block text-[13px] text-muted">
              {hint}
            </span>
          ) : null}
        </label>
      ) : null}
    </div>
  );
}
