"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

/** Horizontal, scroll-snapped rail with keyboard-accessible arrows. Native scrolling — no hijack. */
export function Rail({ children, ariaLabel, className }: { children: React.ReactNode; ariaLabel: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const by = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * Math.min(420, ref.current.clientWidth * 0.8), behavior: "smooth" });
  return (
    <div className={cn("relative", className)}>
      <div ref={ref} role="region" aria-label={ariaLabel} tabIndex={0} className="-mx-(--gutter) flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-(--gutter) px-(--gutter) pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      <div className="mt-6 flex gap-2">
        <button type="button" onClick={() => by(-1)} aria-label="Oldingi" className="grid size-11 place-items-center rounded-full border border-(--line) transition-colors hover:bg-orange hover:text-white hover:border-orange">
          <ArrowLeft size={18} />
        </button>
        <button type="button" onClick={() => by(1)} aria-label="Keyingi" className="grid size-11 place-items-center rounded-full border border-(--line) transition-colors hover:bg-orange hover:text-white hover:border-orange">
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
