import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2", className)} aria-label="EduTech — bosh sahifa">
      <span className="relative grid size-8 place-items-center rounded-[10px] bg-orange text-white shadow-[0_6px_16px_-6px_rgba(255,107,26,.8)] transition-transform duration-500 ease-[var(--ease-out)] group-hover:rotate-[-8deg]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3 4.5h10M3 8h7M3 11.5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      {!compact ? (
        <span className="font-display text-[1.25rem] font-bold tracking-[-0.04em]">
          Edu<span className="text-orange">Tech</span>
        </span>
      ) : null}
    </Link>
  );
}
