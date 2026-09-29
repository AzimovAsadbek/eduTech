"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { isDesktop, prefersReducedMotion } from "./env";

const INTERACTIVE = "a, button, [role=button], input, textarea, select, [data-cursor]";

/**
 * Desktop-only custom cursor: a small dot + lagging ring. Grows over links/buttons.
 * Disabled on touch and under reduced motion. One rAF loop that only runs while the pointer moves
 * (it stops once the ring has caught up), transforms only.
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

    // Pointer target, ring and dot positions, ring scale (current → target).
    let mx = 0, my = 0, rx = 0, ry = 0, dx = 0, dy = 0, scale = 1, scaleTo = 1;
    let raf = 0;
    let shown = false;
    let inside = true;
    let mode = "default";

    const frame = () => {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      dx += (mx - dx) * 0.55;
      dy += (my - dy) * 0.55;
      scale += (scaleTo - scale) * 0.2;
      r.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${scale})`;
      d.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
      const settled = Math.abs(mx - rx) < 0.1 && Math.abs(my - ry) < 0.1 && Math.abs(scaleTo - scale) < 0.001;
      raf = settled ? 0 : requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };
    // The dot hides over "view" targets, where the ring grows into a label.
    const paint = () => {
      const visible = shown && inside;
      r.style.opacity = visible ? "1" : "0";
      d.style.opacity = visible && mode !== "view" ? "1" : "0";
    };

    const move = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (!shown) {
        shown = true;
        rx = dx = mx;
        ry = dy = my;
        paint();
      }
      kick();
    };
    const over = (e: PointerEvent) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>(INTERACTIVE);
      mode = target?.dataset.cursor ?? (target ? "link" : "default");
      r.dataset.mode = mode;
      d.dataset.mode = mode;
      scaleTo = target ? 1.5 : 1;
      paint();
      kick();
    };
    const down = () => {
      scaleTo = 0.85;
      kick();
    };
    const up = () => {
      scaleTo = 1;
      kick();
    };
    const leave = () => {
      inside = false;
      paint();
    };
    const enter = () => {
      inside = true;
      paint();
    };

    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerover", over, { passive: true });
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    document.documentElement.addEventListener("mouseleave", leave);
    document.documentElement.addEventListener("mouseenter", enter);
    return () => {
      cancelAnimationFrame(raf);
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
      <div
        ref={dot}
        className="absolute -top-1 -left-1 size-2 rounded-full bg-orange opacity-0 mix-blend-difference transition-opacity duration-300"
      />
      <div
        ref={ring}
        className="absolute -top-[18px] -left-[18px] flex size-9 items-center justify-center rounded-full border border-orange/70 text-[10px] font-semibold tracking-wider text-white uppercase opacity-0 transition-[background-color,opacity] duration-300 data-[mode=view]:border-transparent data-[mode=view]:bg-orange/90"
      >
        <span className="opacity-0 transition-opacity [[data-mode=view]>&]:opacity-100">{t("view")}</span>
      </div>
    </div>
  );
}
