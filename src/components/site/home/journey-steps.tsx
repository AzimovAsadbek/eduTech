"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

/**
 * One-shot entrance for a server-rendered list. The server markup carries no state, so everything is visible
 * without JavaScript. After mount — only when the element is still entirely below the fold and motion is allowed —
 * it gets `data-state="pending"` (CSS hides and offsets its parts); the first time it scrolls into the lower part
 * of the viewport it flips to `"in"` and plain CSS transitions play. Nothing already on screen is ever hidden.
 */
function useEnterOnce<T extends HTMLElement>(rootMargin: string) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return;

    el.dataset.state = "pending";
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        el.dataset.state = "in";
        io.disconnect();
      },
      { rootMargin },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      // Never leave content hidden without an observer that can reveal it (effect re-runs, fast refresh).
      if (el.dataset.state === "pending") delete el.dataset.state;
    };
  }, [rootMargin]);

  return ref;
}

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** The journey's `<ol>`: plays its entrance once the list's top passes the lower quarter of the viewport. */
export function JourneySteps({ children, className, style }: Props) {
  const ref = useEnterOnce<HTMLOListElement>("0px 0px -25% 0px");
  return (
    <ol ref={ref} className={className} style={style}>
      {children}
    </ol>
  );
}
