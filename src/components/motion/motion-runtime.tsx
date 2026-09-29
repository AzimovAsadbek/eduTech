"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { isDesktop, prefersReducedMotion } from "./env";

/**
 * The one piece of client code behind <Reveal>, <SplitHeading scroll> and <Counter>, mounted once per locale layout.
 *
 * After each route renders it measures every motion element in a single layout pass. Elements already on
 * screen are left alone (no flicker, no delayed LCP); elements still below the fold are marked
 * `data-rv="pending"` (hidden by CSS) and revealed by one shared IntersectionObserver. The animation
 * itself is a CSS transition on transform/opacity, so it runs on the compositor. Nothing is hidden when
 * JavaScript is off or the visitor prefers reduced motion.
 *
 * On phones and tablets a staggered group reveals each child as it enters (a tall list would otherwise
 * animate items that are still off-screen).
 */

const TARGETS = "[data-reveal]:not([data-rv]), [data-split='scroll']:not([data-rv]), [data-count]:not([data-rv])";
const COUNT_MS = 1600;

let observer: IntersectionObserver | null = null;

const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));

function countUp(el: HTMLElement) {
  const target = Number(el.dataset.count);
  const final = el.dataset.final ?? String(target);
  const prefix = el.dataset.prefix ?? "";
  const suffix = el.dataset.suffix ?? "";
  const format = new Intl.NumberFormat(document.documentElement.lang || undefined);
  const start = performance.now();
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / COUNT_MS);
    if (t >= 1) {
      el.textContent = final;
      return;
    }
    el.textContent = `${prefix}${format.format(Math.round(target * easeOutExpo(t)))}${suffix}`;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

const seconds = (el: HTMLElement, name: string) => parseFloat(el.style.getPropertyValue(name)) || 0;

/**
 * Once the entrance has played, the element goes to "done": the transition rules no longer apply, so
 * the element's own hover/focus transitions (e.g. a card lifting on hover) behave exactly as authored.
 */
function settle(el: HTMLElement, key: "rv" | "rvChild", ms: number) {
  window.setTimeout(() => {
    el.dataset[key] = "done";
  }, ms + 80);
}

function reveal(el: HTMLElement) {
  if (el.dataset.rvChild === "pending") {
    el.dataset.rvChild = "in";
    settle(el, "rvChild", 700);
    return;
  }
  el.dataset.rv = "in";
  if (el.dataset.count) countUp(el);
  const delay = seconds(el, "--rv-delay") * 1000;
  if (el.dataset.split) settle(el, "rv", delay + 1100 + el.querySelectorAll("[data-word]").length * 45);
  else if (el.dataset.reveal === "group") settle(el, "rv", delay + 900 + Math.max(0, el.children.length - 1) * seconds(el, "--rv-stagger") * 1000);
  else if (el.dataset.reveal) settle(el, "rv", delay + 900);
}

function getObserver(): IntersectionObserver {
  observer ??= new IntersectionObserver(
    (entries, io) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        io.unobserve(entry.target);
        reveal(entry.target as HTMLElement);
      }
    },
    // Trigger once the element is a little inside the viewport, not on its first pixel.
    { rootMargin: "0px 0px -8% 0px" },
  );
  return observer;
}

function scan() {
  const io = getObserver();
  // Drop elements that left the DOM with the previous route; keep watching the ones still waiting.
  io.disconnect();
  document.querySelectorAll<HTMLElement>("[data-rv='pending'], [data-rv-child='pending']").forEach((el) => io.observe(el));

  const elements = Array.from(document.querySelectorAll<HTMLElement>(TARGETS));
  if (!elements.length) return;
  const fold = window.innerHeight;
  const perChild = !isDesktop();

  // Read phase: all measurements first, so the page lays out once.
  const writes: (() => void)[] = [];
  for (const el of elements) {
    if (el.dataset.reveal === "group" && perChild) {
      const kids = Array.from(el.children) as HTMLElement[];
      const below = kids.map((k) => k.getBoundingClientRect().top >= fold);
      writes.push(() => {
        el.dataset.rv = "split";
        kids.forEach((k, i) => {
          if (!below[i]) return;
          k.dataset.rvChild = "pending";
          io.observe(k);
        });
      });
      continue;
    }
    const below = el.getBoundingClientRect().top >= fold;
    writes.push(() => {
      if (!below) {
        el.dataset.rv = "done";
        return;
      }
      if (el.dataset.reveal === "group") Array.from(el.children).forEach((k, i) => (k as HTMLElement).style.setProperty("--i", String(i)));
      if (el.dataset.count) {
        el.dataset.final = el.textContent ?? "";
        el.textContent = `${el.dataset.prefix ?? ""}0${el.dataset.suffix ?? ""}`;
      }
      el.dataset.rv = "pending";
      io.observe(el);
    });
  }
  // Write phase.
  for (const write of writes) write();
}

export function MotionRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") return;
    // Effects run after the router has committed the new route and restored/reset the scroll position.
    // (Not deferred to requestAnimationFrame: background tabs pause rAF, and the scan must not wait for focus.)
    scan();
  }, [pathname]);

  return null;
}
