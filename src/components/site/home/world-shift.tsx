"use client";

import { Play } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";

const CARDS = ["Reels", "YouTube", "Video"] as const;

/**
 * SIGNATURE MOMENT: the EDU → MEDIA transition.
 * Desktop: a pinned curtain darkens the viewport while "EDU" morphs into "MEDIA".
 * Mobile: a dark sheet with rounded corners slides over the education world; as it scrolls in,
 * the outlined "EDU" drifts away, "MEDIA" lands, an orange rail draws and three content cards fan out —
 * all scroll-driven, no pinning, no scroll hijack.
 */
export function WorldShift() {
  const t = useTranslations("worldShift");
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      if (prefersReducedMotion()) {
        el.dataset.world = "media";
        gsap.set(el.querySelector("[data-curtain]"), { scaleY: 1 });
        gsap.set("[data-edu]", { autoAlpha: 0 });
        gsap.set(["[data-media]", "[data-tag]", "[data-m-media]", "[data-m-tag]", "[data-card]", "[data-rail]"], { autoAlpha: 1, yPercent: 0, y: 0, x: 0, rotate: 0, scaleX: 1 });
        return;
      }
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: "+=120%",
            pin: true,
            scrub: 0.8,
            anticipatePin: 1,
            onUpdate: (self) => {
              if (self.progress > 0.12) el.dataset.world = "media";
              else delete el.dataset.world;
            },
          },
        });
        tl.fromTo(el.querySelector("[data-curtain]"), { scaleY: 0 }, { scaleY: 1, ease: "none", duration: 1 }, 0)
          .to("[data-edu]", { yPercent: -120, autoAlpha: 0, duration: 0.5 }, 0.25)
          .fromTo("[data-media]", { yPercent: 120, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5 }, 0.5)
          .fromTo("[data-tag]", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.8);
      });

      mm.add("(max-width: 1023px)", () => {
        const sheet = el.querySelector<HTMLElement>("[data-sheet]")!;
        el.dataset.world = "media";
        // 1. The sheet rises over the previous section with a subtle scale, like a bottom sheet settling.
        gsap.fromTo(sheet, { y: 48, scale: 0.96, borderRadius: "40px 40px 0 0" }, { y: 0, scale: 1, borderRadius: "28px 28px 0 0", ease: "none", scrollTrigger: { trigger: el, start: "top 95%", end: "top 45%", scrub: 0.5 } });
        // 2. Word morph + rail + cards, driven by the sheet travelling up the screen.
        const tl = gsap.timeline({ scrollTrigger: { trigger: sheet, start: "top 80%", end: "top 15%", scrub: 0.5 } });
        tl.fromTo("[data-m-edu]", { x: 0, autoAlpha: 0.9 }, { x: "-35%", autoAlpha: 0, ease: "power1.in", duration: 0.28 }, 0)
          .fromTo("[data-m-media]", { x: "35%", autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power2.out", duration: 0.35 }, 0.22)
          .fromTo("[data-rail]", { scaleX: 0 }, { scaleX: 1, ease: "none", duration: 0.4 }, 0.35)
          .fromTo("[data-m-tag]", { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.45)
          .fromTo("[data-card]", { y: 60, rotate: 0, autoAlpha: 0 }, { y: 0, rotate: (i: number) => [-8, 0, 8][i], autoAlpha: 1, stagger: 0.08, duration: 0.5, ease: "power2.out" }, 0.5);
        // 3. Idle glow drift keeps the sheet alive after the scrub finishes.
        gsap.to("[data-glow]", { xPercent: 12, yPercent: -8, duration: 5, yoyo: true, repeat: -1, ease: "sine.inOut" });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative overflow-hidden bg-paper lg:flex lg:min-h-screen lg:items-center" aria-label={t("ariaLabel")}>
      {/* Desktop curtain */}
      <div data-curtain className="absolute inset-0 hidden origin-top scale-y-0 bg-ink lg:block" aria-hidden />
      <div className="orange-glow absolute inset-0 hidden opacity-60 lg:block" aria-hidden />
      <div className="container-x relative hidden py-24 text-center lg:block">
        <p className="t-eyebrow mb-8 text-(--fg-muted) mix-blend-difference">{t("eyebrow")}</p>
        <div className="relative mx-auto h-[1.1em] overflow-hidden font-display text-[clamp(4rem,16vw,14rem)] leading-none font-bold tracking-[-0.06em]">
          <span data-edu className="absolute inset-x-0 text-ink">
            {t("edu")}
          </span>
          <span data-media className="absolute inset-x-0 text-white opacity-0">
            {t("media")}
          </span>
        </div>
        <p data-tag className="t-lead mx-auto mt-8 max-w-xl text-white/70 opacity-0">
          {t("lead")}
        </p>
      </div>

      {/* Mobile / tablet sheet */}
      <div className="relative -mt-6 pt-4 lg:hidden">
        <div data-sheet className="relative -mb-px overflow-hidden rounded-t-[28px] bg-ink px-5 pt-12 pb-14 text-white shadow-[0_-24px_60px_-20px_rgba(0,0,0,.35)] will-change-transform">
          <div data-glow aria-hidden className="pointer-events-none absolute -top-24 right-[-30%] size-[70vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.45),transparent)] blur-2xl" />
          <span aria-hidden className="absolute top-3 left-1/2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/20" />
          <p className="t-eyebrow text-white/55">{t("eyebrow")}</p>

          <div className="relative mt-6 h-[1em] overflow-hidden font-display text-[clamp(4.5rem,24vw,8rem)] leading-none font-bold tracking-[-0.06em]">
            <span data-m-edu className="absolute inset-x-0 text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,.55)]">
              {t("edu")}
            </span>
            <span data-m-media className="absolute inset-x-0 text-white opacity-0">
              {t("media")}
            </span>
          </div>
          <div data-rail className="mt-5 h-0.5 w-24 origin-left scale-x-0 rounded-full bg-orange" aria-hidden />
          <p data-m-tag className="mt-5 max-w-sm text-base leading-relaxed text-white/70 opacity-0">
            {t("lead")}
          </p>

          <div className="relative mt-10 flex h-40 items-end justify-center" aria-hidden>
            {CARDS.map((c, i) => (
              <div
                key={c}
                data-card
                className={`glass absolute bottom-0 flex h-36 w-24 flex-col justify-between rounded-2xl p-3 opacity-0 will-change-transform ${i === 1 ? "[--glass-bg:rgba(255,107,26,.22)] [--glass-border:rgba(255,107,26,.5)]" : "[--glass-bg:rgba(255,255,255,.08)]"}`}
                style={{ left: `calc(50% + ${(i - 1) * 76}px - 3rem)`, transformOrigin: "50% 120%", zIndex: i === 1 ? 2 : 1 }}
              >
                <span className="grid size-7 place-items-center rounded-full bg-orange text-white">
                  <Play size={12} fill="currentColor" />
                </span>
                <span className="t-meta text-white/85">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
