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
          <div key={item.id}>
            <h3>
              <button
                id={btnId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : item.id)}
                className="group flex w-full items-center gap-4 py-5 text-left"
              >
                {item.meta ? <span className="t-meta w-8 shrink-0 text-(--fg-muted)">{item.meta}</span> : null}
                <span className="t-h4 flex-1">{item.title}</span>
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border border-(--line) transition-[transform,background-color,color] duration-300 ease-[var(--ease-out)] group-hover:bg-orange group-hover:text-white",
                    isOpen && "rotate-45 bg-orange text-white",
                  )}
                  aria-hidden
                >
                  <Plus size={16} />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              hidden={!isOpen}
              className="grid transition-[grid-template-rows] duration-300"
            >
              <div className={cn("pb-6 text-(--fg-muted) leading-relaxed", item.meta && "pl-12")}>{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
