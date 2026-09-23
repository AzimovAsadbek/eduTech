"use client";

import { ExternalLink, Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import type { SafeUser } from "@/server/modules/auth/service";
import { roleAtLeast } from "@/components/admin/labels";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./global-search";
import { titleForPath } from "./nav";
import { Sidebar } from "./sidebar";
import { UserMenu } from "./user-menu";

const STORAGE_KEY = "edutech.admin.sidebar";

// Sidebar collapse state lives in localStorage; exposed as an external store so SSR renders expanded without a hydration flash.
const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "collapsed";
  } catch {
    return false;
  }
}
function writeCollapsed(next: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, next ? "collapsed" : "open");
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

export function AdminShell({ user, children }: { user: SafeUser; children: ReactNode }) {
  const pathname = usePathname();
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    // Close the drawer after a navigation.
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  const toggle = useCallback(() => writeCollapsed(!readCollapsed()), []);

  useEffect(() => {
    document.title = `${titleForPath(pathname)} — EduTech Admin`;
  }, [pathname]);

  return (
    <div className="flex min-h-dvh bg-paper-2 text-ink">
      <Sidebar role={user.role} collapsed={collapsed} onToggle={toggle} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-(--line) bg-paper/85 px-4 backdrop-blur-md sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-10 place-items-center rounded-[10px] text-ink hover:bg-ink/5 lg:hidden"
            aria-label="Menyuni ochish"
            aria-expanded={mobileOpen}
          >
            <Menu size={20} />
          </button>
          <h2 className={cn("font-display text-[15px] font-semibold tracking-[-0.01em] text-ink", "shrink-0")}>{titleForPath(pathname)}</h2>
          <div className="ml-auto flex flex-1 items-center justify-end gap-3">
            {roleAtLeast(user.role, "ADMIN") ? <GlobalSearch /> : null}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="t-meta hidden h-10 items-center gap-1.5 rounded-full border border-(--line) px-3.5 text-muted hover:border-ink hover:text-ink md:inline-flex"
            >
              Sayt <ExternalLink size={12} aria-hidden />
            </a>
            <UserMenu name={user.name} email={user.email} role={user.role} />
          </div>
        </header>
        <main id="admin-main" className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
