"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LeadStatus } from "@prisma/client";
import { adminApi, errorMessage } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { LEAD_STATUS_LABELS, LEAD_STATUS_ORDER } from "@/components/admin/labels";
import { LEAD_STATUS_COLORS } from "@/components/admin/ui/status-badge";
import { useToast } from "@/components/admin/ui/toast";

const tone: Record<LeadStatus, string> = {
  NEW: "bg-orange-soft text-orange-deep border-orange/20",
  CONTACTED: "bg-[#EAF1FF] text-[#1D4ED8] border-[#2563EB]/20",
  IN_PROGRESS: "bg-[#FFF4E0] text-[#B45309] border-[#D97706]/20",
  CONVERTED: "bg-[#E8F7EC] text-[#15803D] border-[#16A34A]/20",
  LOST: "bg-paper-3 text-muted border-(--line-strong)",
};

/** Inline status change with optimistic update; the row re-renders from the server after refresh. */
export function LeadStatusSelect({ id, status, size = "sm", onChanged }: { id: string; status: LeadStatus; size?: "sm" | "md"; onChanged?: (s: LeadStatus) => void }) {
  const [value, setValue] = useState<LeadStatus>(status);
  const [prevStatus, setPrevStatus] = useState(status);
  if (status !== prevStatus) {
    setPrevStatus(status);
    setValue(status);
  }
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const toast = useToast();

  const change = async (next: LeadStatus) => {
    const prev = value;
    setValue(next);
    setBusy(true);
    try {
      await adminApi.patch(`/leads/${id}`, { status: next });
      onChanged?.(next);
      toast.success("Holat yangilandi", LEAD_STATUS_LABELS[next]);
      router.refresh();
    } catch (e) {
      setValue(prev);
      toast.error("Holatni oʻzgartirib boʻlmadi", errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <span className="relative inline-flex items-center">
      <span aria-hidden className="pointer-events-none absolute left-2.5 size-1.5 rounded-full" style={{ background: LEAD_STATUS_COLORS[value] }} />
      <select
        aria-label="Lid holati"
        value={value}
        disabled={busy}
        onChange={(e) => change(e.target.value as LeadStatus)}
        className={cn(
          "cursor-pointer appearance-none rounded-full border pr-6 pl-6 font-semibold transition-colors focus:outline-none focus-visible:ring-3 focus-visible:ring-orange/25 disabled:opacity-60",
          size === "sm" ? "h-7 text-xs" : "h-9 text-sm",
          tone[value],
          "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222.5%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:12px] bg-[position:right_0.5rem_center] bg-no-repeat",
        )}
      >
        {LEAD_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {LEAD_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </span>
  );
}
