import { Fragment, type CSSProperties, type ElementType } from "react";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  className?: string;
  as?: ElementType;
  /** Words to wrap with the accent colour. */
  accent?: string[];
  delay?: number;
  /**
   * `true` (default): the words rise when the heading scrolls into view (driven by `MotionRuntime`).
   * `false`: for headings on screen at load; a CSS animation starts with the first paint, no JS needed.
   */
  scroll?: boolean;
  id?: string;
}

/** Word-by-word clip reveal. Server-rendered markup; the motion itself is CSS (globals.css, "Motion"). */
export function SplitHeading({ text, className, as: Tag = "h2", accent = [], delay = 0, scroll = true, id }: Props) {
  const words = text.split(" ");
  return (
    <Tag className={cn(className)} id={id} aria-label={text} data-split={scroll ? "scroll" : "load"} style={delay ? ({ "--rv-delay": `${delay}s` } as CSSProperties) : undefined}>
      {words.map((w, i) => {
        const clean = w.replace(/[.,!?]/g, "");
        const isAccent = accent.includes(clean);
        // The space sits between the clipping boxes, not inside them: a trailing space inside an
        // inline-block is dropped at the end of its line, which glued the words together.
        return (
          <Fragment key={i}>
            <span className="inline-block overflow-hidden pb-[0.08em] align-top" aria-hidden>
              <span data-word className={cn("inline-block", isAccent && "text-orange")} style={{ "--i": i } as CSSProperties}>
                {w}
              </span>
            </span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        );
      })}
    </Tag>
  );
}
