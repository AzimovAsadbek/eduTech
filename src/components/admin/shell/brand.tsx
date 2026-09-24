import Link from "next/link";
import { LogoMark, Logo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export function AdminBrand({ compact, className, href = "/admin" }: { compact?: boolean; className?: string; href?: string }) {
  if (compact) {
    return (
      <Link href={href} className={cn("inline-flex items-center", className)} aria-label="EduTech admin — boshqaruv">
        <LogoMark tone="dark" className="h-7 w-auto" />
      </Link>
    );
  }
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-3", className)} aria-label="EduTech admin — boshqaruv">
      <Logo href={null} tone="dark" height={24} />
      <span className="t-meta rounded-full border border-white/15 px-2 py-0.5 text-[10px] text-white/60">ADMIN</span>
    </Link>
  );
}
