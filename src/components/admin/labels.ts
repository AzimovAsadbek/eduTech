import type { ContentStatus, LeadStatus, LeadType, Role } from "@prisma/client";
import { STATUS_LABELS } from "@/server/modules/telegram/format";

/** Client-safe UI vocabulary for the admin panel (Uzbek Latin). */
export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = STATUS_LABELS;
export const LEAD_STATUS_ORDER: LeadStatus[] = ["NEW", "CONTACTED", "IN_PROGRESS", "CONVERTED", "LOST"];

export const LEAD_TYPE_LABELS: Record<LeadType, string> = {
  EDUCATION: "Taʼlim",
  MEDIA: "Media",
  GENERAL: "Umumiy",
};

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  DRAFT: "Qoralama",
  PUBLISHED: "Nashr etilgan",
  ARCHIVED: "Arxiv",
};

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super admin",
  ADMIN: "Admin",
  EDITOR: "Muharrir",
};

export const ROLE_RANK: Record<Role, number> = { EDITOR: 1, ADMIN: 2, SUPER_ADMIN: 3 };

export function roleAtLeast(role: Role, min: Role) {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}
