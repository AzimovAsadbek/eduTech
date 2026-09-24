"use client";

import { ArrowUpRight, Phone, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics";
import { readServiceContext, useApplyDialog } from "./apply-dialog";

interface Props {
  phone?: string;
  telegram?: string;
}

/**
 * Mobile-only conversion dock in the spirit of an iOS tab bar: heavy frosted glass, hairline highlight,
 * one primary action. Slides in after the hero, tints itself to the surface underneath and steps aside
 * over forms, the footer and the open menu. On media pages it opens a service request instead.
 */
export function MobileCtaBar({ phone, telegram }: Props) {
  const t = useTranslations("common.actions");
  const tb = useTranslations("mobileBar");
  const pathname = usePathname();
  const { open } = useApplyDialog();
  const [visible, setVisible] = useState(false);
  const [dark, setDark] = useState(false);
  const isMediaPage = pathname === "/media" || pathname.startsWith("/media/");

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
      const under = document.elementFromPoint(window.innerWidth / 2, vh - 40);
      setDark(Boolean(under?.closest('[data-world="media"]')));
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
  }, [pathname]);

  const onPrimary = () => {
    track("cta_click", { source: "mobile-bar", kind: isMediaPage ? "media" : "education" });
    if (isMediaPage) open({ type: "MEDIA", serviceSlug: readServiceContext() });
    else open();
  };

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-3 bottom-3 z-40 transition-[transform,opacity] duration-500 ease-[var(--ease-out)] lg:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-[26px] p-1.5 backdrop-blur-2xl backdrop-saturate-150 transition-colors duration-300",
          "shadow-[0_18px_48px_-16px_rgba(0,0,0,.45),inset_0_1px_0_rgba(255,255,255,.55)]",
          dark ? "border border-white/12 bg-[rgba(24,24,26,.72)] shadow-[0_18px_48px_-16px_rgba(0,0,0,.7),inset_0_1px_0_rgba(255,255,255,.12)]" : "border border-white/70 bg-[rgba(255,255,255,.72)]",
        )}
      >
        <button
          type="button"
          onClick={onPrimary}
          tabIndex={visible ? 0 : -1}
          className="relative flex h-12 flex-1 items-center justify-center gap-2 overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,#ff8a45_0%,#ff6b1a_55%,#f25f11_100%)] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(255,107,26,.8),inset_0_1px_0_rgba(255,255,255,.35)] transition-transform duration-200 active:scale-[0.97]"
        >
          {isMediaPage ? t("order") : t("apply")} <ArrowUpRight size={18} />
        </button>
        {phone ? (
          <a
            href={`tel:${phone.replace(/\s/g, "")}`}
            aria-label={tb("call")}
            tabIndex={visible ? 0 : -1}
            onClick={() => track("phone_click", { source: "mobile-bar" })}
            className={cn("grid size-12 shrink-0 place-items-center rounded-[20px] transition-transform duration-200 active:scale-95", dark ? "bg-white/12 text-white" : "bg-ink/[0.06] text-ink")}
          >
            <Phone size={18} />
          </a>
        ) : null}
        {telegram ? (
          <a
            href={telegram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Telegram"
            tabIndex={visible ? 0 : -1}
            onClick={() => track("telegram_click", { source: "mobile-bar" })}
            className={cn("grid size-12 shrink-0 place-items-center rounded-[20px] transition-transform duration-200 active:scale-95", dark ? "bg-white/12 text-white" : "bg-ink/[0.06] text-ink")}
          >
            <Send size={18} />
          </a>
        ) : null}
      </div>
    </div>
  );
}
