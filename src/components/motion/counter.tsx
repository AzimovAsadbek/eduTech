"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "./gsap";

/** Animates "500+" style labels: counts the numeric part, keeps the suffix. */
export function Counter({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const match = /^(\D*)(\d[\d\s]*)(.*)$/.exec(value);
  const prefix = match?.[1] ?? "";
  const num = match ? parseInt(match[2].replace(/\s/g, ""), 10) : NaN;
  const suffix = match?.[3] ?? "";

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || Number.isNaN(num) || prefersReducedMotion()) return;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: num,
        duration: 1.6,
        ease: "expo.out",
        scrollTrigger: { trigger: el, start: "top 90%", once: true },
        onUpdate: () => {
          el.textContent = `${prefix}${Math.round(obj.v).toLocaleString("uz-UZ")}${suffix}`;
        },
      });
    },
    { scope: ref },
  );

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
