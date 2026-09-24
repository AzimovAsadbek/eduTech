"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { nav } from "@/config/site";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { useApplyDialog } from "./apply-dialog";

type Stage = "top" | "glass" | "compact";

/**
 * Sticky header with three scroll stages (transparent → glass → compact)
 * and automatic inversion while a `[data-world="media"]` section is under it.
 */
export function Header() {
  const pathname = usePathname();
  const [stage, setStage] = useState<Stage>("top");
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const { open: openApply } = useApplyDialog();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const next: Stage = y < 24 ? "top" : y < 240 ? "glass" : "compact";
      setStage((prev) => (prev === next ? prev : next));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Invert colours while a dark "media world" section sits under the header.
  useEffect(() => {
    const headerH = 72;
    const check = () => {
      const sections = document.querySelectorAll<HTMLElement>('[data-world="media"]');
      let hit = false;
      sections.forEach((s) => {
        const r = s.getBoundingClientRect();
        if (r.top <= headerH && r.bottom >= headerH) hit = true;
      });
      setDark((prev) => (prev === hit ? prev : hit));
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [pathname]);

  const lastPath = useRef(pathname);
  useEffect(() => {
    if (lastPath.current !== pathname) {
      lastPath.current = pathname;
      // Route changed while the drawer was open — close it on the next tick.
      const t = setTimeout(() => setOpen(false), 0);
      return () => clearTimeout(t);
    }
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const first = menuRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onApply = useCallback(() => {
    setOpen(false);
    openApply();
  }, [openApply]);

  const inverted = dark || open;

  return (
    <>
      <header
        data-stage={stage}
        data-inverted={inverted ? "" : undefined}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow,height,color] duration-500 ease-[var(--ease-out)]",
          inverted ? "text-white" : "text-ink",
          stage === "top" && "h-20 bg-transparent",
          stage === "glass" && "h-20 glass border-x-0 border-t-0 shadow-none",
          stage === "compact" && "h-16 glass border-x-0 border-t-0",
          inverted && stage !== "top" && "[--glass-bg:rgba(11,11,12,.6)] [--glass-border:rgba(255,255,255,.1)]",
        )}
      >
        <div className="container-x flex h-full items-center justify-between gap-6">
          <Logo tone={inverted ? "dark" : "light"} height={34} />
          <nav aria-label="Asosiy navigatsiya" className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group/nav relative rounded-full px-3.5 py-2 text-[15px] font-medium transition-colors duration-200",
                    inverted ? "text-white/80 hover:bg-white/10 hover:text-white" : "text-ink/75 hover:bg-ink/[0.06] hover:text-ink",
                    active && (inverted ? "text-white" : "text-ink"),
                  )}
                >
                  <span className="relative">
                    {item.label}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute -bottom-1 left-0 h-0.5 w-full origin-left rounded-full bg-orange transition-transform duration-300 ease-[var(--ease-out)]",
                        active ? "scale-x-100" : "scale-x-0 group-hover/nav:scale-x-100",
                      )}
                    />
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <Button size={stage === "compact" ? "sm" : "md"} onClick={onApply} className="hidden sm:inline-flex" magnetic icon={<ArrowUpRight size={16} />}>
              Kursga yozilish
            </Button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Menyuni yopish" : "Menyuni ochish"}
              className={cn("grid size-11 place-items-center rounded-full border transition-colors lg:hidden", inverted ? "border-white/20 hover:bg-white/10" : "border-(--line) hover:bg-ink/5")}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu — full-screen, staggered */}
      <div
        id="mobile-menu"
        ref={menuRef}
        role="dialog"
        aria-modal="true"
        aria-label="Menyu"
        hidden={!open}
        className={cn("fixed inset-0 z-40 flex flex-col bg-ink text-white transition-opacity duration-300 lg:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")}
      >
        <div className="orange-glow absolute inset-0 overflow-hidden" aria-hidden />
        <div className="container-x relative flex flex-1 flex-col pt-28 pb-10">
          <nav aria-label="Mobil navigatsiya" className="flex flex-col">
            {nav.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ transitionDelay: open ? `${80 + i * 50}ms` : "0ms" }}
                className={cn(
                  "t-h1 flex items-center justify-between border-b border-white/10 py-4 transition-[opacity,transform] duration-500 ease-[var(--ease-out)]",
                  open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
                )}
              >
                {item.label}
                <ArrowUpRight className="text-orange" />
              </Link>
            ))}
          </nav>
          <div className={cn("mt-auto flex flex-col gap-3 pt-10 transition-opacity duration-500 delay-300", open ? "opacity-100" : "opacity-0")}>
            <Button size="lg" onClick={onApply} icon={<ArrowUpRight size={18} />}>
              Kursga yozilish
            </Button>
            <Button size="lg" variant="outline-inverse" href="/media">
              Media xizmatlar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
