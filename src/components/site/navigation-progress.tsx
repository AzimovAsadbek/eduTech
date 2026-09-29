"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const RESET_MS = 450;
const GIVE_UP_MS = 12_000;

/**
 * A 2px brand-orange bar at the top of the viewport that starts the instant an internal link is clicked
 * and completes when the new route has rendered. Pages are rendered per request, so a navigation waits for
 * the server; the bar makes that wait visible right away instead of the page seeming to ignore the tap.
 * DOM-only state (no React re-renders); styles in globals.css (".nav-progress").
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement>(null);
  const giveUp = useRef(0);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // Capture phase: runs before <Link> prevents the default to navigate on the client.
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname.startsWith("/api/")) return;
      // Same page (hash links, the current route): nothing will load.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      const el = bar.current;
      if (!el) return;
      el.dataset.state = "loading";
      window.clearTimeout(giveUp.current);
      giveUp.current = window.setTimeout(() => (el.dataset.state = "idle"), GIVE_UP_MS);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.clearTimeout(giveUp.current);
    };
  }, []);

  // The new route has committed: finish the bar, then reset it.
  useEffect(() => {
    const el = bar.current;
    if (!el || el.dataset.state !== "loading") return;
    window.clearTimeout(giveUp.current);
    el.dataset.state = "done";
    const t = window.setTimeout(() => (el.dataset.state = "idle"), RESET_MS);
    return () => window.clearTimeout(t);
  }, [pathname]);

  return <div ref={bar} data-state="idle" className="nav-progress" aria-hidden />;
}
