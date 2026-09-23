"use client";

import { formatAdminDate } from "@/components/admin/format";

/**
 * Date rendered inside client components. Intl output for `uz-UZ` differs between Node and browser ICU,
 * so the text is allowed to differ at hydration (one level deep) instead of throwing.
 */
export function DateText({ value, opts, className }: { value: Date | string; opts?: Intl.DateTimeFormatOptions; className?: string }) {
  const d = typeof value === "string" ? new Date(value) : value;
  return (
    <time dateTime={d.toISOString()} className={className} suppressHydrationWarning>
      {formatAdminDate(d, opts)}
    </time>
  );
}
