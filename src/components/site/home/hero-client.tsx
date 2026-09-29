"use client";

import { ArrowDown } from "lucide-react";
import { useEffect } from "react";
import { isDesktop, prefersReducedMotion } from "@/components/motion/env";
import { useApplyDialog } from "@/components/site/apply-dialog";
import { Button } from "@/components/ui/button";

/** The hero is server-rendered; only these two small islands need the browser. */

export function HeroConsultButton({ label }: { label: string }) {
  const { open } = useApplyDialog();
  return (
    <Button size="lg" variant="ghost" onClick={() => open()} icon={<ArrowDown size={18} className="rotate-[-90deg]" />}>
      {label}
    </Button>
  );
}

/**
 * Desktop cursor parallax for the hero scene: one rAF loop, transforms only, idle while the pointer rests.
 * Renders nothing; it attaches to the hero section by id.
 */
export function HeroParallax({ rootId }: { rootId: string }) {
  useEffect(() => {
    const el = document.getElementById(rootId);
    if (!el || !isDesktop() || prefersReducedMotion()) return;
    const scene = el.querySelector<HTMLElement>("[data-scene]");
    const layers = Array.from(el.querySelectorAll<HTMLElement>("[data-depth]"));
    if (!scene || !layers.length) return;
    const depth = layers.map((l) => Number(l.dataset.depth) || 0);
    let rect = scene.getBoundingClientRect();
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;

    const frame = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      layers.forEach((l, i) => {
        l.style.transform = `translate3d(${(x * depth[i] * 24).toFixed(2)}px, ${(y * depth[i] * 18).toFixed(2)}px, 0)`;
      });
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.0005 ? requestAnimationFrame(frame) : 0;
    };
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX - (rect.left + rect.width / 2)) / rect.width;
      ty = (e.clientY - (rect.top + rect.height / 2)) / rect.height;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    const onEnter = () => {
      rect = scene.getBoundingClientRect();
    };
    const onLeave = () => {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(frame);
    };
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [rootId]);

  return null;
}
