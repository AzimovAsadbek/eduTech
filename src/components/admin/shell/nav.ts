import type { Role } from "@prisma/client";
import {
  BookOpen,
  Building2,
  Clapperboard,
  FolderKanban,
  GraduationCap,
  HelpCircle,
  Images,
  Inbox,
  LayoutDashboard,
  MessageSquareQuote,
  Settings,
  Trophy,
  UploadCloud,
  Users,
  type LucideIcon,
} from "lucide-react";
import { roleAtLeast } from "@/components/admin/labels";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  min: Role;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAV: NavSection[] = [
  {
    label: "Umumiy",
    items: [
      { href: "/admin", label: "Boshqaruv", icon: LayoutDashboard, min: "EDITOR" },
      { href: "/admin/leads", label: "Lidlar", icon: Inbox, min: "ADMIN" },
    ],
  },
  {
    label: "Taʼlim",
    items: [
      { href: "/admin/courses", label: "Kurslar", icon: BookOpen, min: "EDITOR" },
      { href: "/admin/course-categories", label: "Yoʻnalishlar", icon: FolderKanban, min: "EDITOR" },
      { href: "/admin/teachers", label: "Oʻqituvchilar", icon: GraduationCap, min: "EDITOR" },
      { href: "/admin/results", label: "Natijalar", icon: Trophy, min: "EDITOR" },
      { href: "/admin/testimonials", label: "Fikrlar", icon: MessageSquareQuote, min: "EDITOR" },
      { href: "/admin/faq", label: "FAQ", icon: HelpCircle, min: "EDITOR" },
    ],
  },
  {
    label: "Media",
    items: [
      { href: "/admin/services", label: "Xizmatlar", icon: Clapperboard, min: "EDITOR" },
      { href: "/admin/media-projects", label: "Loyihalar", icon: FolderKanban, min: "EDITOR" },
      { href: "/admin/gallery", label: "Galereya", icon: Images, min: "EDITOR" },
    ],
  },
  {
    label: "Tizim",
    items: [
      { href: "/admin/branches", label: "Filiallar", icon: Building2, min: "EDITOR" },
      { href: "/admin/uploads", label: "Media kutubxona", icon: UploadCloud, min: "EDITOR" },
      { href: "/admin/settings", label: "Sozlamalar", icon: Settings, min: "SUPER_ADMIN" },
    ],
  },
];

export const USERS_ICON = Users;

export function navForRole(role: Role): NavSection[] {
  return NAV.map((s) => ({ ...s, items: s.items.filter((i) => roleAtLeast(role, i.min)) })).filter((s) => s.items.length > 0);
}

export function isActivePath(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Best-effort page title from the pathname (used in the top bar and document title). */
export function titleForPath(pathname: string): string {
  const all = NAV.flatMap((s) => s.items);
  const item = all.find((i) => isActivePath(pathname, i.href));
  if (!item) return "Boshqaruv";
  if (pathname === item.href) return item.label;
  if (pathname.endsWith("/new")) return `${item.label} · Yangi`;
  return `${item.label} · Tahrirlash`;
}
