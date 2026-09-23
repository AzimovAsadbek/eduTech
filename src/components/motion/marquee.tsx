import { cn } from "@/lib/utils";

/** CSS-only marquee (GPU transform), pauses on hover, static under reduced motion. */
export function Marquee({ items, className, speed = 40 }: { items: string[]; className?: string; speed?: number }) {
  const row = [...items, ...items];
  return (
    <div className={cn("group relative w-full overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]", className)} aria-hidden>
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap will-change-transform group-hover:[animation-play-state:paused] motion-reduce:animate-none" style={{ animationDuration: `${speed}s` }}>
        {row.map((item, i) => (
          <span key={i} className="t-h3 inline-flex items-center gap-10 text-(--fg-muted)/60">
            {item}
            <span className="size-1.5 rounded-full bg-orange" />
          </span>
        ))}
      </div>
    </div>
  );
}
