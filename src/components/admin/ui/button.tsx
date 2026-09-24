import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "xs" | "sm" | "md";

const base =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[10px] font-semibold whitespace-nowrap select-none transition-[background-color,color,border-color,box-shadow,transform] duration-200 ease-(--ease-out) disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "bg-orange text-white shadow-[0_6px_16px_-8px_rgba(255,107,26,.7)] hover:bg-orange-deep",
  secondary: "bg-ink text-white hover:bg-ink-3",
  outline: "border border-(--line-strong) bg-paper text-ink hover:bg-paper-3",
  ghost: "bg-transparent text-ink hover:bg-ink/5",
  danger: "bg-danger/10 text-danger hover:bg-danger hover:text-white",
};

const sizes: Record<Size, string> = {
  xs: "h-8 px-2.5 text-[13px]",
  sm: "h-9 px-3.5 text-sm",
  md: "h-10 px-4 text-sm",
};

export interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  icon?: ReactNode;
  loading?: boolean;
  iconOnly?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, AdminButtonProps>(function Button(
  { className, variant = "primary", size = "md", href, icon, loading, iconOnly, children, type = "button", disabled, ...props },
  ref,
) {
  const classes = cn(base, variants[variant], sizes[size], iconOnly && "aspect-square px-0", className);
  const content = (
    <>
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden /> : icon ? <span className="inline-flex shrink-0 [&>svg]:size-4" aria-hidden>{icon}</span> : null}
      {iconOnly ? <span className="sr-only">{children}</span> : children}
    </>
  );
  if (href) {
    const external = /^https?:|^tel:|^mailto:/.test(href);
    return external ? (
      <a href={href} className={classes} target={/^https?:/.test(href) ? "_blank" : undefined} rel="noopener noreferrer">
        {content}
      </a>
    ) : (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button ref={ref} type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...props}>
      {content}
    </button>
  );
});
