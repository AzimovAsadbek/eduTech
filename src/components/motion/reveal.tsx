import type { CSSProperties, ElementType, ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  /** Stagger the direct children (seconds between them) instead of animating the wrapper. */
  stagger?: number;
  delay?: number;
  /** Rise distance in px. */
  y?: number;
  id?: string;
}

/**
 * Scroll entrance (opacity + translate). Pure markup: it renders on the server and needs no JavaScript of
 * its own. The shared `MotionRuntime` hides only what is still below the fold when the page starts and
 * reveals it with a CSS transition as it enters the viewport, so content is never hidden without JS and
 * nothing already on screen flickers. Styles live in globals.css ("Motion").
 */
export function Reveal({ children, className, as: Tag = "div", stagger, delay, y = 28, id }: Props) {
  const style: Record<string, string> = { "--rv-y": `${y}px` };
  if (delay) style["--rv-delay"] = `${delay}s`;
  if (stagger) style["--rv-stagger"] = `${stagger}s`;
  return (
    <Tag className={className} id={id} data-reveal={stagger ? "group" : "self"} style={style as CSSProperties}>
      {children}
    </Tag>
  );
}
