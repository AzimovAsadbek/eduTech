"use client";

import { useEffect, useRef } from "react";
import { gsap, isDesktop, prefersReducedMotion } from "./gsap";

/**
 * Desktop-only custom cursor: a small dot + lagging ring. Grows over links/buttons,
 * snaps to elements marked `data-magnetic`. Disabled on touch and under reduced motion.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isDesktop() || prefersReducedMotion()) return;
    const d = dot.current!;
    const r = ring.current!;
    document.body.dataset.cursor = "on";
    gsap.set([d, r], { opacity: 0 });
    let shown = false;

    const xTo = gsap.quickTo(r, "x", { duration: 0.35, ease: "power3" });
    const yTo = gsap.quickTo(r, "y", { duration: 0.35, ease: "power3" });
    const dxTo = gsap.quickTo(d, "x", { duration: 0.08, ease: "power3" });
    const dyTo = gsap.quickTo(d, "y", { duration: 0.08, ease: "power3" });

    let magnet: HTMLElement | null = null;

    const move = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.set([d, r], { x: e.clientX, y: e.clientY });
        gsap.to([d, r], { opacity: 1, duration: 0.3 });
      }
      if (magnet) {
        const b = magnet.getBoundingClientRect();
        const cx = b.left + b.width / 2;
        const cy = b.top + b.height / 2;
        const mx = cx + (e.clientX - cx) * 0.25;
        const my = cy + (e.clientY - cy) * 0.25;
        xTo(mx);
        yTo(my);
        gsap.to(magnet, { x: (e.clientX - cx) * 0.18, y: (e.clientY - cy) * 0.18, duration: 0.4, ease: "power3" });
      } else {
        xTo(e.clientX);
        yTo(e.clientY);
      }
      dxTo(e.clientX);
      dyTo(e.clientY);
    };

    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("a, button, [role=button], input, textarea, select, [data-cursor]");
      const m = (e.target as HTMLElement).closest<HTMLElement>("[data-magnetic]");
      if (m && m !== magnet) {
        magnet = m;
        const b = m.getBoundingClientRect();
        gsap.to(r, { width: b.width + 16, height: b.height + 16, borderRadius: 999, duration: 0.35, ease: "power3" });
      } else if (!m && magnet) {
        gsap.to(magnet, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
        magnet = null;
        gsap.to(r, { width: 36, height: 36, duration: 0.35, ease: "power3" });
      }
      const mode = t?.dataset.cursor ?? (t ? "link" : "default");
      r.dataset.mode = mode;
      d.dataset.mode = mode;
      if (!m) gsap.to(r, { scale: t ? 1.6 : 1, duration: 0.3, ease: "power3" });
    };

    const down = () => gsap.to(r, { scale: 0.85, duration: 0.15 });
    const up = () => gsap.to(r, { scale: 1, duration: 0.3 });
    const leave = () => gsap.to([d, r], { opacity: 0, duration: 0.2 });
    const enter = () => gsap.to([d, r], { opacity: 1, duration: 0.2 });

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    document.documentElement.addEventListener("mouseleave", leave);
    document.documentElement.addEventListener("mouseenter", enter);
    return () => {
      delete document.body.dataset.cursor;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerover", over);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      document.documentElement.removeEventListener("mouseleave", leave);
      document.documentElement.removeEventListener("mouseenter", enter);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[9999] hidden lg:block">
      <div ref={dot} className="absolute -top-1 -left-1 size-2 rounded-full bg-orange mix-blend-difference data-[mode=view]:opacity-0" />
      <div
        ref={ring}
        className="absolute -top-[18px] -left-[18px] flex size-9 items-center justify-center rounded-full border border-orange/70 text-[10px] font-semibold tracking-wider text-white uppercase transition-[background-color] data-[mode=view]:bg-orange/90 data-[mode=view]:border-transparent"
      >
        <span className="opacity-0 transition-opacity [[data-mode=view]>&]:opacity-100">Koʻrish</span>
      </div>
    </div>
  );
}
