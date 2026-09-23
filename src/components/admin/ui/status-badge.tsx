import type { ContentStatus, LeadStatus, LeadType, Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { CONTENT_STATUS_LABELS, LEAD_STATUS_LABELS, LEAD_TYPE_LABELS, ROLE_LABELS } from "@/components/admin/labels";

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  NEW: "#FF6B1A",
  CONTACTED: "#2563EB",
  IN_PROGRESS: "#D97706",
  CONVERTED: "#16A34A",
  LOST: "#737373",
};

const leadStatusClass: Record<LeadStatus, string> = {
  NEW: "bg-orange-soft text-orange-deep",
  CONTACTED: "bg-[#EAF1FF] text-[#1D4ED8]",
  IN_PROGRESS: "bg-[#FFF4E0] text-[#B45309]",
  CONVERTED: "bg-[#E8F7EC] text-[#15803D]",
  LOST: "bg-paper-3 text-muted",
};

const contentStatusClass: Record<ContentStatus, string> = {
  DRAFT: "bg-paper-3 text-muted",
  PUBLISHED: "bg-[#E8F7EC] text-[#15803D]",
  ARCHIVED: "bg-[#FFF4E0] text-[#B45309]",
};

const leadTypeClass: Record<LeadType, string> = {
  EDUCATION: "border-orange/30 text-orange-deep",
  MEDIA: "border-ink/30 text-ink",
  GENERAL: "border-(--line-strong) text-muted",
};

const roleClass: Record<Role, string> = {
  SUPER_ADMIN: "bg-ink text-white",
  ADMIN: "bg-orange-soft text-orange-deep",
  EDITOR: "bg-paper-3 text-muted",
};

const pill = "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold whitespace-nowrap";

export function LeadStatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <span className={cn(pill, leadStatusClass[status], className)}>
      <span aria-hidden className="size-1.5 rounded-full" style={{ background: LEAD_STATUS_COLORS[status] }} />
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}

export function ContentStatusBadge({ status, className }: { status: ContentStatus; className?: string }) {
  return <span className={cn(pill, contentStatusClass[status], className)}>{CONTENT_STATUS_LABELS[status]}</span>;
}

export function LeadTypeBadge({ type, className }: { type: LeadType; className?: string }) {
  return <span className={cn(pill, "t-meta h-6 border bg-transparent font-medium", leadTypeClass[type], className)}>{LEAD_TYPE_LABELS[type]}</span>;
}

export function RoleBadge({ role, className }: { role: Role; className?: string }) {
  return <span className={cn(pill, "h-5 px-2 text-[11px]", roleClass[role], className)}>{ROLE_LABELS[role]}</span>;
}
