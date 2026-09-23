import { cn } from "@/lib/utils";

export function Chip({ children, className, active, as: Tag = "span", ...props }: { children: React.ReactNode; className?: string; active?: boolean; as?: "span" | "button" } & Record<string, unknown>) {
  return (
    <Tag
      className={cn(
        "t-meta inline-flex h-8 items-center gap-1.5 rounded-full border px-3 transition-colors duration-200",
        active ? "border-orange bg-orange text-white" : "border-(--line) bg-transparent text-(--fg-muted) hover:border-(--fg-muted)",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
