"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { gsap, isDesktop, prefersReducedMotion } from "./gsap";

/**
 * Desktop-only custom cursor: a small dot + lagging ring. Grows over links/buttons,
 * snaps to elements marked `data-magnetic`. Disabled on touch and under reduced motion.
 */
export function Cursor() {
  const t = useTranslations("cursor");
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

    const move = (e: PointerEvent) => {
      if (!shown) {
        shown = true;
        gsap.set([d, r], { x: e.clientX, y: e.clientY });
        gsap.to([d, r], { opacity: 1, duration: 0.3 });
      }
      xTo(e.clientX);
      yTo(e.clientY);
      dxTo(e.clientX);
      dyTo(e.clientY);
    };

    const over = (e: PointerEvent) => {
      const t = (e.target as HTMLElement).closest<HTMLElement>("a, button, [role=button], input, textarea, select, [data-cursor]");
      const mode = t?.dataset.cursor ?? (t ? "link" : "default");
      r.dataset.mode = mode;
      d.dataset.mode = mode;
      gsap.to(r, { scale: t ? 1.5 : 1, duration: 0.3, ease: "power3" });
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
        <span className="opacity-0 transition-opacity [[data-mode=view]>&]:opacity-100">{t("view")}</span>
      </div>
    </div>
  );
}
