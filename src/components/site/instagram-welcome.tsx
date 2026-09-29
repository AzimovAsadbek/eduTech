"use client";

import { ArrowUpRight, X } from "lucide-react";
import { InstagramGlyph } from "@/components/brand/social-icons";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { track } from "@/lib/analytics";
import { cameFromInstagram } from "@/lib/attribution";
import { cn } from "@/lib/utils";
import { useApplyDialog } from "./apply-dialog";

const DISMISS_KEY = "et_ig_welcome";
const HANDOFF_SCROLL = 560; // the mobile dock takes over below this point

/**
 * A one-tap path to enrolment for visitors arriving from Instagram (tagged link, Instagram referrer
 * or the Instagram in-app browser): a frosted card offering the free consultation in a short form.
 * Shown once per session on academy pages; never on the media pages.
 */
export function InstagramWelcome() {
  const t = useTranslations("growth.igWelcome");
  const pathname = usePathname();
  const { open } = useApplyDialog();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname === "/media" || pathname.startsWith("/media/")) return;
    let dismissed = false;
    try {
      dismissed = window.sessionStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      /* storage unavailable */
    }
    if (dismissed || !cameFromInstagram()) return;
    const timer = window.setTimeout(() => {
      setVisible(true);
      track("ig_welcome_view");
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    if (!visible) return;
    const onScroll = () => {
      if (window.innerWidth < 1024 && window.scrollY > HANDOFF_SCROLL) setVisible(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [visible]);

  const dismiss = () => {
    setVisible(false);
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* storage unavailable */
    }
  };

  const onCta = () => {
    track("ig_welcome_click");
    dismiss();
    open({ quick: true, source: "ig-welcome" });
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("title")}
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-3 bottom-3 z-40 pb-[env(safe-area-inset-bottom)] transition-[transform,opacity] duration-500 ease-[var(--ease-out)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px]",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0",
      )}
    >
      <div className="relative flex items-start gap-3 rounded-[24px] border border-white/70 bg-[rgba(255,255,255,.8)] p-4 pr-11 shadow-[0_24px_56px_-20px_rgba(0,0,0,.4),inset_0_1px_0_rgba(255,255,255,.7)] backdrop-blur-2xl backdrop-saturate-150">
        <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(135deg,#feda75_0%,#fa7e1e_30%,#d62976_60%,#962fbf_85%,#4f5bd5_100%)] text-white shadow-[0_8px_18px_-8px_rgba(214,41,118,.8)]">
          <InstagramGlyph size={22} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-[15px] font-semibold tracking-tight text-ink">{t("title")}</p>
          <p className="mt-0.5 text-sm leading-snug text-muted">{t("text")}</p>
          <button
            type="button"
            onClick={onCta}
            tabIndex={visible ? 0 : -1}
            className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-full bg-[linear-gradient(180deg,#ff8a45_0%,#ff6b1a_55%,#ee5c0f_100%)] px-4 text-sm font-semibold text-white shadow-[0_10px_22px_-10px_rgba(255,107,26,.8),inset_0_1px_0_rgba(255,255,255,.35)] transition-transform active:scale-[0.97]"
          >
            {t("cta")} <ArrowUpRight size={16} />
          </button>
        </div>
        <button type="button" onClick={dismiss} tabIndex={visible ? 0 : -1} aria-label={t("close")} className="absolute top-3 right-3 grid size-8 place-items-center rounded-full bg-ink/[0.06] text-ink/70 transition-colors hover:bg-ink/10">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
