"use client";

import { ArrowUpRight, Phone, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { useApplyDialog } from "./apply-dialog";

interface Props {
  phone?: string;
  telegram?: string;
}

/**
 * Mobile-only conversion bar: a glass dock that slides in once the visitor has scrolled past the hero,
 * and gets out of the way over the application section, the footer and while the menu is open.
 */
export function MobileCtaBar({ phone, telegram }: Props) {
  const t = useTranslations("common.actions");
  const tb = useTranslations("mobileBar");
  const { open } = useApplyDialog();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hideZones = () => Array.from(document.querySelectorAll<HTMLElement>("#ariza, #media-inquiry, footer, [data-hide-cta]"));
    const check = () => {
      if (document.body.style.overflow === "hidden") return setVisible(false);
      const vh = window.innerHeight;
      const overZone = hideZones().some((z) => {
        const r = z.getBoundingClientRect();
        return r.top < vh * 0.9 && r.bottom > vh * 0.4;
      });
      setVisible(window.scrollY > 560 && !overZone);
    };
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    const mo = new MutationObserver(check);
    mo.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      mo.disconnect();
    };
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-3 bottom-3 z-40 transition-[transform,opacity] duration-500 ease-[var(--ease-out)] lg:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
      )}
    >
      <div className="glass flex items-center gap-2 rounded-full p-1.5 shadow-lg [--glass-bg:rgba(255,255,255,.78)]">
        <button
          type="button"
          onClick={() => {
            track("cta_click", { source: "mobile-bar" });
            open();
          }}
          tabIndex={visible ? 0 : -1}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-orange font-semibold text-white active:bg-orange-deep"
        >
          {t("apply")} <ArrowUpRight size={18} />
        </button>
        {phone ? (
          <a href={`tel:${phone.replace(/\s/g, "")}`} aria-label={tb("call")} tabIndex={visible ? 0 : -1} onClick={() => track("phone_click", { source: "mobile-bar" })} className="grid size-12 shrink-0 place-items-center rounded-full bg-ink text-white active:bg-ink-3">
            <Phone size={18} />
          </a>
        ) : null}
        {telegram ? (
          <a href={telegram} target="_blank" rel="noopener noreferrer" aria-label="Telegram" tabIndex={visible ? 0 : -1} onClick={() => track("telegram_click", { source: "mobile-bar" })} className="grid size-12 shrink-0 place-items-center rounded-full border border-ink/10 bg-white/70 text-ink active:bg-orange-soft">
            <Send size={18} />
          </a>
        ) : null}
      </div>
    </div>
  );
}
