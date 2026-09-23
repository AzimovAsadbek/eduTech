import { cn } from "@/lib/utils";

export function Eyebrow({ children, className, dot = true }: { children: React.ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("t-eyebrow inline-flex items-center gap-2 text-(--fg-muted)", className)}>
      {dot ? <span className="size-1.5 rounded-full bg-orange" aria-hidden /> : null}
      {children}
    </span>
  );
}
