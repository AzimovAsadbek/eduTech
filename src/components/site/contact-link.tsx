"use client";

import { track } from "@/lib/analytics";

/** Tracks phone / Telegram / Instagram clicks without cookies. */
export function ContactLink({ kind, href, className, children }: { kind: "phone" | "telegram" | "instagram"; href: string; className?: string; children: React.ReactNode }) {
  const external = /^https?:/.test(href);
  return (
    <a
      href={href}
      className={className}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onClick={() => track(kind === "phone" ? "phone_click" : kind === "telegram" ? "telegram_click" : "instagram_click")}
    >
      {children}
    </a>
  );
}
