import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({ title, description, action, icon, className, compact }: { title: string; description?: ReactNode; action?: ReactNode; icon?: ReactNode; className?: string; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center", compact ? "px-4 py-8" : "px-6 py-16", className)}>
      <span className="grid size-12 place-items-center rounded-full bg-orange-soft text-orange [&>svg]:size-5" aria-hidden>
        {icon ?? <Inbox />}
      </span>
      <p className="mt-4 font-display text-lg font-semibold tracking-[-0.01em] text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-muted">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
