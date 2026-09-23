"use client";

import { useRef, type ElementType } from "react";
import { cn } from "@/lib/utils";
import { gsap, prefersReducedMotion, useGSAP } from "./gsap";

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
}

/** Scroll-linked entrance. Animates transform/opacity only; no-ops under reduced motion. */
export function Reveal({ children, className, as: Tag = "div", stagger, delay = 0, y = 28, once = true, start = "top 85%" }: Props) {
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
      gsap.set(targets, { opacity: 0, y });
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: "expo.out",
        delay,
        stagger: stagger ?? 0,
        scrollTrigger: { trigger: el, start, once, toggleActions: once ? "play none none none" : "play none none reverse" },
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={cn(className)}>
      {children}
    </Tag>
  );
}
