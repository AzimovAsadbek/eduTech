import Link from "next/link";
import { cn } from "@/lib/utils";

export function AdminBrand({ compact, className, href = "/admin" }: { compact?: boolean; className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="EduTech admin — boshqaruv">
      <span className="relative grid size-8 shrink-0 place-items-center rounded-[9px] bg-orange text-white shadow-[0_6px_16px_-6px_rgba(255,107,26,.8)] transition-transform duration-500 ease-(--ease-out) group-hover:rotate-[-8deg]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M3 4.5h10M3 8h7M3 11.5h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </span>
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.125rem] font-bold tracking-[-0.04em] text-white">
            Edu<span className="text-orange">Tech</span>
          </span>
          <span className="t-meta mt-1 text-[10px] text-white/45">ADMIN</span>
        </span>
      ) : null}
    </Link>
  );
}
