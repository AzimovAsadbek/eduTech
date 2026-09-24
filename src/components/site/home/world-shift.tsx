"use client";

import { useRef } from "react";
import { gsap, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";

/**
 * SIGNATURE MOMENT: the EDU → MEDIA transition.
 * Desktop pins a curtain that darkens as "EDU" morphs into "MEDIA".
 * Mobile runs the same scrub without pinning (no scroll hijack, still scroll-driven).
 */
export function WorldShift() {
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
      const build = (pin: boolean) => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: pin ? "top top" : "top 70%",
            end: pin ? "+=120%" : "bottom 60%",
            pin,
            scrub: pin ? 0.8 : 0.4,
            anticipatePin: pin ? 1 : 0,
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
      };
      mm.add("(min-width: 1024px)", () => build(true));
      mm.add("(max-width: 1023px)", () => {
        // Phones: the whole section darkens with scroll (no curtain, so nothing is left uncovered), then the word morphs.
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el,
            start: "top 75%",
            end: "top 15%",
            scrub: 0.4,
            onUpdate: (self) => {
              if (self.progress > 0.35) el.dataset.world = "media";
              else delete el.dataset.world;
            },
          },
        });
        tl.fromTo(el, { backgroundColor: "#ffffff" }, { backgroundColor: "#0b0b0c", ease: "none", duration: 0.5 }, 0)
          .to("[data-edu]", { yPercent: -120, autoAlpha: 0, duration: 0.35 }, 0.2)
          .fromTo("[data-media]", { yPercent: 120, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.35 }, 0.4)
          .fromTo("[data-tag]", { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.25 }, 0.7);
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative flex min-h-[60vh] items-center overflow-hidden bg-paper lg:min-h-screen" aria-label="Taʼlimdan mediaga oʻtish">
      <div data-curtain className="absolute inset-0 hidden origin-top scale-y-0 bg-ink lg:block" aria-hidden />
      <div className="orange-glow absolute inset-0 opacity-60" aria-hidden />
      <div className="container-x relative py-24 text-center">
        <p className="t-eyebrow mb-8 text-(--fg-muted) mix-blend-difference">Ikki dunyo — bitta jamoa</p>
        <div className="relative mx-auto h-[1.1em] overflow-hidden font-display text-[clamp(4rem,16vw,14rem)] leading-none font-bold tracking-[-0.06em]">
          <span data-edu className="absolute inset-x-0 text-ink">
            EDU
          </span>
          <span data-media className="absolute inset-x-0 text-white opacity-0">
            MEDIA
          </span>
        </div>
        <p data-tag className="t-lead mx-auto mt-8 max-w-xl text-white/70 opacity-0">
          Taʼlim — bu boshlanish. Media — bu brendingizning ovozi. Bizneslar uchun kontent, marketing va prodakshn.
        </p>
      </div>
    </section>
  );
}
