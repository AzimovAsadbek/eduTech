"use client";

import { usePathname, useRouter } from "next/navigation";
import { Segmented } from "@/components/admin/ui/segmented";

const OPTIONS = [
  { value: "7", label: "7 kun" },
  { value: "30", label: "30 kun" },
  { value: "90", label: "90 kun" },
] as const;

type Range = (typeof OPTIONS)[number]["value"];

/** 7 / 30 / 90-day switch for the current admin page; the range lives in `?days=`. */
export function RangeSelector({ days }: { days: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const value = (String(days) as Range) || "30";
  return <Segmented<Range> label="Davr" value={value} options={[...OPTIONS]} onChange={(v) => router.push(`${pathname}?days=${v}`, { scroll: false })} />;
}
