import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "inverse" | "outline-inverse";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap select-none transition-[transform,background-color,color,border-color,box-shadow] duration-300 ease-[var(--ease-out)] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

const variants: Record<Variant, string> = {
  primary: "bg-orange text-white shadow-[0_8px_24px_-8px_rgba(255,107,26,.6)] hover:bg-orange-deep hover:shadow-[0_12px_32px_-8px_rgba(255,107,26,.7)]",
  secondary: "bg-ink text-white hover:bg-ink-3",
  ghost: "bg-transparent text-ink hover:bg-ink/5 media-world:text-white media-world:hover:bg-white/10",
  inverse: "bg-white text-ink hover:bg-orange-soft",
  "outline-inverse": "bg-transparent text-white border border-white/25 hover:border-white/60 hover:bg-white/5",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-13 px-7 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  href?: string;
  icon?: ReactNode;
  magnetic?: boolean;
  external?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", href, icon, magnetic, external, children, type = "button", ...props },
  ref,
) {
  const classes = cn(base, variants[variant], sizes[size], className);
  const content = (
    <>
      <span>{children}</span>
      {icon ? (
        <span className="inline-flex shrink-0 transition-transform duration-300 ease-[var(--ease-out)] group-hover/btn:translate-x-0.5" aria-hidden>
          {icon}
        </span>
      ) : null}
    </>
  );
  if (href) {
    const isExternal = external || /^https?:|^tel:|^mailto:/.test(href);
    return isExternal ? (
      <a href={href} className={classes} data-magnetic={magnetic ? "" : undefined} target={/^https?:/.test(href) ? "_blank" : undefined} rel="noopener noreferrer">
        {content}
      </a>
    ) : (
      <Link href={href} className={classes} data-magnetic={magnetic ? "" : undefined}>
        {content}
      </Link>
    );
  }
  return (
    <button ref={ref} type={type} className={classes} data-magnetic={magnetic ? "" : undefined} {...props}>
      {content}
    </button>
  );
});
