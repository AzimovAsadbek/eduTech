"use client";

import { useRef, type ElementType } from "react";
import { cn } from "@/lib/utils";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "./gsap";

interface Props {
  text: string;
  className?: string;
  as?: ElementType;
  /** Words to wrap with the accent colour. */
  accent?: string[];
  delay?: number;
  scroll?: boolean;
  id?: string;
}

/**
 * Word-by-word reveal with a clip mask — no SplitText dependency, SSR-safe:
 * the HTML is fully rendered on the server; GSAP only animates the spans.
 */
export function SplitHeading({ text, className, as: Tag = "h2", accent = [], delay = 0, scroll = true, id }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const words = text.split(" ");

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      const spans = el.querySelectorAll<HTMLElement>("[data-word]");
      const tween = gsap.fromTo(
        spans,
        { yPercent: 110, rotate: 2 },
        { yPercent: 0, rotate: 0, duration: 1.1, ease: "expo.out", stagger: 0.045, delay, paused: true, immediateRender: true },
      );
      if (!scroll) {
        tween.play();
        return;
      }
      ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: () => tween.play() });
    },
    { scope: ref, dependencies: [text] },
  );

  return (
    <Tag ref={ref} className={cn(className)} id={id} aria-label={text}>
      {words.map((w, i) => {
        const clean = w.replace(/[.,!?]/g, "");
        const isAccent = accent.includes(clean);
        return (
          <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-top" aria-hidden>
            <span data-word className={cn("inline-block will-change-transform", isAccent && "text-orange")}>
              {w}
            </span>
            {i < words.length - 1 ? " " : null}
          </span>
        );
      })}
    </Tag>
  );
}
