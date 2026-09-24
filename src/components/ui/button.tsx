import Link from "next/link";
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "inverse" | "outline-inverse";
type Size = "sm" | "md" | "lg";

/**
 * Hover language shared by every variant: the surface shifts one tone, the button lifts 1px,
 * the icon nudges. Nothing scales, nothing bounces — calm and premium.
 */
const base =
  "group/btn relative isolate inline-flex items-center justify-center gap-2 overflow-hidden rounded-full font-semibold whitespace-nowrap select-none transition-[transform,background-color,color,border-color,box-shadow] duration-300 ease-[var(--ease-out)] hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  primary:
    "bg-orange text-white shadow-[0_6px_20px_-8px_rgba(254,126,3,.55)] hover:bg-orange-deep hover:shadow-[0_10px_28px_-8px_rgba(254,126,3,.6)] after:absolute after:inset-0 after:-z-10 after:bg-[linear-gradient(120deg,transparent_30%,rgba(255,255,255,.18)_50%,transparent_70%)] after:translate-x-[-120%] after:transition-transform after:duration-700 after:ease-[var(--ease-out)] hover:after:translate-x-[120%]",
  secondary: "bg-ink text-white hover:bg-ink-3",
  ghost: "bg-transparent text-ink border border-(--line) hover:border-ink/30 hover:bg-ink/[0.04] media-world:text-white media-world:border-white/15 media-world:hover:border-white/40 media-world:hover:bg-white/[0.06]",
  inverse: "bg-white text-ink hover:bg-orange-soft",
  "outline-inverse": "bg-transparent text-white border border-white/25 hover:border-white/70 hover:bg-white/[0.06]",
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
        <span className="inline-flex shrink-0 transition-transform duration-300 ease-[var(--ease-out)] group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" aria-hidden>
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
