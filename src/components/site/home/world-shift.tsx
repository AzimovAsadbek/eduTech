"use client";

import { useRef } from "react";
import { gsap, isDesktop, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";

/**
 * SIGNATURE MOMENT: the EDU → MEDIA transition. A pinned curtain darkens as the wordmark
 * morphs from "EDU" to "MEDIA". On mobile/reduced motion it's a static dark band.
 */
export function WorldShift() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      if (prefersReducedMotion() || !isDesktop()) {
        el.dataset.world = "media";
        return;
      }
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "+=120%",
          pin: true,
          scrub: 0.8,
          anticipatePin: 1,
          // Let the header invert once the curtain actually covers it.
          onUpdate: (self) => {
            if (self.progress > 0.12) el.dataset.world = "media";
            else delete el.dataset.world;
          },
        },
      });
      tl.fromTo(el.querySelector("[data-curtain]"), { scaleY: 0 }, { scaleY: 1, ease: "none", duration: 1 }, 0)
        .to("[data-edu]", { yPercent: -120, opacity: 0, duration: 0.5 }, 0.25)
        .fromTo("[data-media]", { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5 }, 0.5)
        .fromTo("[data-tag]", { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 }, 0.8);
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative flex min-h-[70vh] items-center overflow-hidden bg-ink lg:bg-paper lg:min-h-screen" aria-label="Taʼlimdan mediaga oʻtish">
      <div data-curtain className="absolute inset-0 origin-top bg-ink lg:scale-y-0" aria-hidden />
      <div className="orange-glow absolute inset-0 opacity-60" aria-hidden />
      <div className="container-x relative py-24 text-center">
        <p className="t-eyebrow mb-8 text-white/60 lg:text-(--fg-muted)">Ikki dunyo — bitta jamoa</p>
        <div className="relative mx-auto h-[1.1em] overflow-hidden font-display text-[clamp(4rem,16vw,14rem)] leading-none font-bold tracking-[-0.06em]">
          <span data-edu className="absolute inset-x-0 hidden text-ink lg:block">
            EDU
          </span>
          <span data-media className="absolute inset-x-0 text-white lg:opacity-0">
            MEDIA
          </span>
        </div>
        <p data-tag className="t-lead mx-auto mt-8 max-w-xl text-white/70 lg:opacity-0">
          Taʼlim — bu boshlanish. Media — bu brendingizning ovozi. Bizneslar uchun kontent, marketing va prodakshn.
        </p>
      </div>
    </section>
  );
}
