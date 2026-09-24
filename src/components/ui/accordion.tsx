"use client";

import { Plus } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

export interface AccordionItem {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
  meta?: React.ReactNode;
}

/** Accessible disclosure list with a real height transition (grid-rows trick) — no layout jumps. */
export function Accordion({ items, className, defaultOpen }: { items: AccordionItem[]; className?: string; defaultOpen?: string }) {
  const [open, setOpen] = useState<string | null>(defaultOpen ?? null);
  const base = useId();
  return (
    <div className={cn("divide-y divide-(--line) border-y border-(--line)", className)}>
      {items.map((item) => {
        const isOpen = open === item.id;
        const btnId = `${base}-${item.id}-btn`;
        const panelId = `${base}-${item.id}-panel`;
        return (
          <div key={item.id} className={cn("transition-colors duration-300", isOpen && "bg-orange-soft/40 media-world:bg-white/[0.03]")}>
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="group flex w-full items-start gap-4 px-2 py-5 text-left sm:items-center sm:px-4"
              >
                {item.meta ? <span className={cn("t-meta mt-1 w-7 shrink-0 transition-colors sm:mt-0", isOpen ? "text-orange" : "text-(--fg-muted)")}>{item.meta}</span> : null}
                <span className={cn("t-h4 flex-1 transition-colors", isOpen ? "text-orange" : "group-hover:text-orange")}>{item.title}</span>
                <span
                  className={cn(
                    "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border border-(--line) transition-[transform,background-color,color,border-color] duration-300 ease-[var(--ease-out)] group-hover:border-orange group-hover:text-orange sm:mt-0",
                    isOpen && "rotate-45 border-orange bg-orange text-white group-hover:text-white",
                  )}
                  aria-hidden
                >
                  <Plus size={15} />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              className={cn("grid transition-[grid-template-rows] duration-400 ease-[var(--ease-out)]", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
            >
              <div className="overflow-hidden">
                <div className={cn("px-2 pb-6 leading-relaxed text-(--fg-muted) sm:px-4", item.meta && "sm:pl-15")}>{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
