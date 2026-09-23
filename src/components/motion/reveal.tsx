"use client";

import { useRef, type ElementType } from "react";
import { cn } from "@/lib/utils";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "./gsap";

interface Props {
  children: React.ReactNode;
  className?: string;
  as?: ElementType;
  /** Stagger direct children instead of animating the wrapper. */
  stagger?: number;
  delay?: number;
  y?: number;
  once?: boolean;
  start?: string;
  id?: string;
}

/** Scroll-linked entrance. Animates transform/opacity only; no-ops under reduced motion. */
export function Reveal({ children, className, as: Tag = "div", stagger, delay = 0, y = 28, once = true, start = "top 85%", id }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const targets = stagger ? Array.from(el.children) : [el];
      if (prefersReducedMotion()) {
        gsap.set(targets, { opacity: 1, y: 0, clearProps: "all" });
        return;
      }
      const tween = gsap.fromTo(
        targets,
        { opacity: 0, y },
        { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", delay, stagger: stagger ?? 0, paused: true, immediateRender: true },
      );
      ScrollTrigger.create({
        trigger: el,
        start,
        once,
        onEnter: () => tween.play(),
        onLeaveBack: once ? undefined : () => tween.reverse(),
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={cn(className)} id={id}>
      {children}
    </Tag>
  );
}
