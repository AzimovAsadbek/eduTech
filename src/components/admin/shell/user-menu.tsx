"use client";

import { ChevronDown, KeyRound, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import type { Role } from "@prisma/client";
import { adminApi, errorMessage } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
import { RoleBadge } from "@/components/admin/ui/status-badge";
import { useToast } from "@/components/admin/ui/toast";

export function UserMenu({ name, email, role }: { name: string; email: string; role: Role }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const logout = async () => {
    setBusy(true);
    try {
      await adminApi.post("/auth/logout");
      router.push("/admin/login");
      router.refresh();
    } catch (e) {
      toast.error("Chiqishda xatolik", errorMessage(e));
      setBusy(false);
    }
  };

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-2 rounded-full border border-(--line) bg-paper py-1 pr-2 pl-1 text-left transition-colors hover:bg-paper-3"
      >
        <span className="grid size-8 place-items-center rounded-full bg-ink text-xs font-bold text-white" aria-hidden>
          {initials}
        </span>
        <span className="hidden max-w-[140px] truncate text-sm font-semibold text-ink sm:block">{name}</span>
        <ChevronDown size={14} className={cn("text-muted transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      <div
        id={id}
        role="menu"
        hidden={!open}
        className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-(--radius-md) border border-(--line) bg-paper shadow-md"
      >
        <div className="border-b border-(--line) px-4 py-3">
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          <p className="truncate text-xs text-muted">{email}</p>
          <div className="mt-2">
            <RoleBadge role={role} />
          </div>
        </div>
        <div className="p-1.5">
          <Link role="menuitem" href="/admin/settings?tab=password" onClick={() => setOpen(false)} className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm text-ink hover:bg-paper-3">
            <KeyRound size={16} className="text-muted" aria-hidden /> Parolni oʻzgartirish
          </Link>
          {role === "SUPER_ADMIN" ? (
            <Link role="menuitem" href="/admin/settings" onClick={() => setOpen(false)} className="flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm text-ink hover:bg-paper-3">
              <Settings size={16} className="text-muted" aria-hidden /> Sozlamalar
            </Link>
          ) : null}
          <button role="menuitem" type="button" onClick={logout} disabled={busy} className="flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm text-danger hover:bg-danger/8 disabled:opacity-50">
            <LogOut size={16} aria-hidden /> {busy ? "Chiqilmoqda…" : "Chiqish"}
          </button>
        </div>
      </div>
    </div>
  );
}
