import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ children, className, as: Tag = "section" }: { children: ReactNode; className?: string; as?: "section" | "div" | "article" }) {
  return <Tag className={cn("rounded-(--radius-md) border border-(--line) bg-paper shadow-sm", className)}>{children}</Tag>;
}

export function CardHeader({ title, description, actions, eyebrow, className }: { title: ReactNode; description?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; className?: string }) {
  return (
    <header className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-(--line) px-5 py-4", className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="t-eyebrow mb-1 text-muted">{eyebrow}</p> : null}
        <h2 className="t-h4 text-ink">{title}</h2>
        {description ? <p className="mt-0.5 text-[13px] text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}
