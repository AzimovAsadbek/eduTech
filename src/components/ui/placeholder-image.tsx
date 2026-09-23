import Image from "next/image";
import { cn } from "@/lib/utils";

interface Props {
  src?: string | null;
  alt: string;
  className?: string;
  label?: string;
  sizes?: string;
  priority?: boolean;
  fill?: boolean;
  width?: number;
  height?: number;
}

/**
 * Renders a real photo when the CMS has one; otherwise an honest, branded placeholder surface
 * (never a stock image). Keeps layout stable either way.
 */
export function PlaceholderImage({ src, alt, className, label, sizes = "(min-width: 1024px) 50vw, 100vw", priority, width, height }: Props) {
  if (src) {
    return (
      <div className={cn("relative overflow-hidden", className)}>
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" {...(width && height ? {} : {})} />
      </div>
    );
  }
  return (
    <div className={cn("placeholder-surface grain relative overflow-hidden", className)} role="img" aria-label={alt}>
      {label ? (
        <span className="t-meta absolute bottom-3 left-3 rounded-full bg-black/10 px-2.5 py-1 text-(--fg)/70 backdrop-blur-sm media-world:bg-white/10">{label}</span>
      ) : null}
    </div>
  );
}
