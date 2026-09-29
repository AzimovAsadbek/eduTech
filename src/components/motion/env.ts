/** Browser capability checks shared by the motion components. Safe to import on the server. */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** A large screen driven by a precise pointer: the only place cursor-driven effects make sense. */
export function isDesktop(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(min-width: 1024px) and (hover: hover) and (pointer: fine)").matches;
}
