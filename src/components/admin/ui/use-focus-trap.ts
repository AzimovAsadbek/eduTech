"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Wraps Tab / Shift+Tab inside an open native <dialog>.
 * `showModal()` makes the page inert, but Chromium still moves focus to the browser chrome (activeElement → body)
 * after the last control, which reads as a dead tab stop for keyboard and screen-reader users.
 */
export function useFocusTrap(ref: RefObject<HTMLDialogElement | null>, active: boolean) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null || n === document.activeElement);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (e.shiftKey && (current === first || !el.contains(current))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !el.contains(current))) {
        e.preventDefault();
        first.focus();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [ref, active]);
}
