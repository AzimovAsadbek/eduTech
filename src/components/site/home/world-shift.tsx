"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";

/**
 * SIGNATURE MOMENT: the EDU → MEDIA transition, identical on every screen size.
 * The section pins, a curtain darkens the viewport from the top while "EDU" lifts away
 * and "MEDIA" lands, then the lead fades in. Phones pin for a shorter distance.
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
        gsap.set(["[data-media]", "[data-tag]"], { autoAlpha: 1, yPercent: 0, y: 0 });
        return;
      }
      const mm = gsap.matchMedia();
      const build = (distance: string, scrub: number) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top top",
            end: `+=${distance}`,
            pin: true,
            scrub,
            anticipatePin: 1,
            onUpdate: (self) => {
              if (self.progress > 0.12) el.dataset.world = "media";
              else delete el.dataset.world;
            },
          },
        });
        tl.fromTo(el.querySelector("[data-curtain]"), { scaleY: 0 }, { scaleY: 1, ease: "none", duration: 1 }, 0)
          .to("[data-edu]", { yPercent: -120, autoAlpha: 0, duration: 0.45 }, 0.25)
          .fromTo("[data-media]", { yPercent: 120, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5 }, 0.45)
          .fromTo("[data-tag]", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.8);
      };
      mm.add("(min-width: 1024px)", () => build("120%", 0.8));
      mm.add("(max-width: 1023px)", () => build("85%", 0.5));
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative flex min-h-[100svh] items-center overflow-hidden bg-paper" aria-label={t("ariaLabel")}>
      <div data-curtain className="absolute inset-0 origin-top scale-y-0 bg-ink" aria-hidden />
      <div className="orange-glow absolute inset-0 opacity-60" aria-hidden />
      <div className="container-x relative py-24 text-center">
        <p className="t-eyebrow mb-8 text-(--fg-muted) mix-blend-difference">{t("eyebrow")}</p>
        <div className="relative mx-auto h-[1.1em] overflow-hidden font-display text-[clamp(4.5rem,18vw,14rem)] leading-none font-bold tracking-[-0.06em]">
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
    </section>
  );
}
