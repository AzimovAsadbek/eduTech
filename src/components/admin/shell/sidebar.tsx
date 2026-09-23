"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import type { Role } from "@prisma/client";
import { cn } from "@/lib/utils";
import { AdminBrand } from "./brand";
import { isActivePath, navForRole } from "./nav";

export function Sidebar({
  role,
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
}: {
  role: Role;
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const sections = navForRole(role);

  const nav = (
    <nav aria-label="Asosiy navigatsiya" className="flex-1 overflow-y-auto px-3 py-4">
      {sections.map((section) => (
        <div key={section.label} className="mb-5">
          <p className={cn("t-eyebrow mb-2 px-3 text-[10px] text-white/35 transition-opacity", collapsed && "lg:sr-only")}>{section.label}</p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = isActivePath(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    onClick={onCloseMobile}
                    className={cn(
                      "group relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-sm font-medium transition-colors duration-150",
                      active ? "bg-white/8 text-white" : "text-white/60 hover:bg-white/5 hover:text-white",
                      collapsed && "lg:justify-center lg:px-0",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-orange transition-[opacity,transform] duration-300 ease-(--ease-out)",
                        active ? "opacity-100" : "scale-y-0 opacity-0",
                      )}
                    />
                    <Icon size={18} strokeWidth={1.75} className={cn("shrink-0", active ? "text-orange" : "text-white/50 group-hover:text-white/80")} aria-hidden />
                    <span className={cn("truncate", collapsed && "lg:sr-only")}>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          "sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-white/8 bg-ink text-white transition-[width] duration-300 ease-(--ease-out) lg:flex",
          collapsed ? "w-[72px]" : "w-[264px]",
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-white/8 px-5", collapsed && "justify-center px-0")}>
          <AdminBrand compact={collapsed} />
        </div>
        {nav}
        <div className="border-t border-white/8 p-3">
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={collapsed}
            aria-label={collapsed ? "Yon panelni kengaytirish" : "Yon panelni yigʻish"}
            className={cn("flex h-10 w-full items-center gap-3 rounded-[10px] px-3 text-sm text-white/55 hover:bg-white/5 hover:text-white", collapsed && "justify-center px-0")}
          >
            {collapsed ? <PanelLeftOpen size={18} aria-hidden /> : <PanelLeftClose size={18} aria-hidden />}
            <span className={cn(collapsed && "sr-only")}>Yigʻish</span>
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        aria-hidden={!mobileOpen}
        className={cn("fixed inset-0 z-50 bg-ink/50 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden", mobileOpen ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={onCloseMobile}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Navigatsiya"
        aria-hidden={!mobileOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-ink text-white shadow-lg transition-transform duration-300 ease-(--ease-out) lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/8 px-5">
          <AdminBrand />
          <button type="button" onClick={onCloseMobile} aria-label="Yopish" className="grid size-9 place-items-center rounded-md text-white/60 hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </div>
        {mobileOpen ? nav : null}
      </aside>
    </>
  );
}
