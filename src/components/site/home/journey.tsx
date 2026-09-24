"use client";

import { useTranslations } from "next-intl";
import { useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/components/motion/gsap";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

type Step = { n: string; key: string; title: string; text: string; detail: string };

/**
 * DISCOVERY: the education model as a scroll-driven journey.
 * Desktop: the whole block (heading included) pins; the rail fills and steps cross-fade with overlap, so
 * the heading and every step title stay readable throughout.
 * Mobile: no pinning — a vertical timeline whose rail fills with scroll and whose steps light up in turn.
 */
export function Journey() {
  const t = useTranslations("journey");
  const steps = t.raw("steps") as Step[];
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      if (prefersReducedMotion()) return;
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const panels = el.querySelectorAll<HTMLElement>("[data-step]");
        const rail = el.querySelector<HTMLElement>("[data-rail]")!;
        const items = el.querySelectorAll<HTMLElement>("[data-rail-item]");
        gsap.set(panels, { autoAlpha: 0, y: 24 });
        gsap.set(panels[0], { autoAlpha: 1, y: 0 });
        items[0].dataset.active = "";

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: el.querySelector("[data-pin]"),
            start: "top top+=88",
            end: `+=${panels.length * 60}%`,
            pin: true,
            scrub: 0.5,
            anticipatePin: 1,
            onUpdate: (self) => {
              const idx = Math.min(panels.length - 1, Math.floor(self.progress * panels.length + 0.15));
              items.forEach((it, i) => (i <= idx ? (it.dataset.active = "") : delete it.dataset.active));
            },
          },
        });
        tl.to(rail, { scaleY: 1, ease: "none", duration: panels.length }, 0);
        panels.forEach((p, i) => {
          if (i === 0) return;
          // Overlapping cross-fade: the previous step is still visible while the next enters.
          tl.to(panels[i - 1], { autoAlpha: 0, y: -16, duration: 0.45, ease: "power2.inOut" }, i - 0.2).to(p, { autoAlpha: 1, y: 0, duration: 0.45, ease: "power2.out" }, i - 0.1);
        });
      });

      mm.add("(max-width: 1023px)", () => {
        const rail = el.querySelector<HTMLElement>("[data-mobile-rail]");
        const items = el.querySelectorAll<HTMLElement>("[data-mobile-step]");
        if (rail) {
          gsap.fromTo(rail, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: rail.parentElement, start: "top 70%", end: "bottom 70%", scrub: true } });
        }
        items.forEach((it) => {
          const tween = gsap.fromTo(it, { opacity: 0.35, x: -8 }, { opacity: 1, x: 0, duration: 0.6, ease: "power2.out", paused: true });
          ScrollTrigger.create({
            trigger: it,
            start: "top 78%",
            once: true,
            onEnter: () => {
              it.dataset.active = "";
              tween.play();
            },
          });
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section ref={root} className="section-y relative" aria-labelledby="journey-title">
      {/* Desktop: pinned block (heading + rail + steps) */}
      <div data-pin className="container-x hidden lg:block">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-5">
            <Eyebrow className="mb-4">{t("eyebrow")}</Eyebrow>
            <h2 id="journey-title" className="t-h2">
              {t("title")} <span className="text-orange">{t("titleAccent")}</span>
            </h2>
            <p className="t-lead mt-4 max-w-sm">{t("lead")}</p>

            <div className="relative mt-12">
              <div className="absolute top-2 bottom-2 left-[1.35rem] w-px bg-(--line)" aria-hidden />
              <div data-rail className="absolute top-2 bottom-2 left-[1.35rem] w-px origin-top scale-y-0 bg-orange" aria-hidden />
              {steps.map((s) => (
                <div key={s.n} data-rail-item className="group relative flex items-center gap-5 py-3.5">
                  <span className="font-display relative z-10 grid size-11 place-items-center rounded-full border border-(--line) bg-paper text-base font-semibold text-muted-2 transition-[color,border-color,background-color] duration-300 group-data-[active]:border-orange group-data-[active]:bg-orange group-data-[active]:text-white">
                    {s.n}
                  </span>
                  <span className="flex flex-col">
                    <span className="t-meta text-(--fg-muted)">{s.key}</span>
                    <span className="font-semibold text-muted-2 transition-colors duration-300 group-data-[active]:text-ink">{s.title}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative col-span-6 col-start-7 min-h-[32rem]">
            {steps.map((s, i) => (
              <article key={s.n} data-step className={cn("absolute inset-0 flex flex-col justify-center", i !== 0 && "invisible opacity-0")} aria-hidden={i !== 0}>
                <p className="t-eyebrow text-orange">
                  {s.n} — {s.key}
                </p>
                <h3 className="t-h1 mt-4">{s.title}</h3>
                <p className="t-lead mt-6 max-w-xl">{s.text}</p>
                <p className="t-meta glass mt-8 inline-flex w-fit rounded-full px-3 py-2 text-ink [--glass-bg:color-mix(in_srgb,var(--color-orange-soft)_70%,white)] [--glass-border:rgba(255,107,26,.18)]">{s.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile / tablet: scroll-lit timeline */}
      <div className="container-x lg:hidden">
        <Eyebrow className="mb-4">{t("eyebrow")}</Eyebrow>
        <h2 className="t-h2">
          {t("title")} <span className="text-orange">{t("titleAccent")}</span>
        </h2>
        <p className="t-lead mt-4">{t("lead")}</p>
        <ol className="relative mt-10">
          <div className="absolute top-3 bottom-3 left-[1.35rem] w-px bg-(--line)" aria-hidden />
          <div data-mobile-rail className="absolute top-3 bottom-3 left-[1.35rem] w-px origin-top bg-orange" aria-hidden />
          {steps.map((s) => (
            <li key={s.n} data-mobile-step className="group relative grid grid-cols-[2.75rem_1fr] gap-4 py-6">
              <span className="font-display relative z-10 grid size-11 place-items-center rounded-full border border-(--line) bg-paper text-base font-semibold transition-[background-color,color,border-color] duration-300 group-data-[active]:border-orange group-data-[active]:bg-orange group-data-[active]:text-white">
                {s.n}
              </span>
              <div>
                <p className="t-eyebrow text-orange">{s.key}</p>
                <h3 className="t-h3 mt-1.5">{s.title}</h3>
                <p className="mt-2 text-(--fg-muted)">{s.text}</p>
                <p className="t-meta glass mt-3 inline-flex rounded-full px-3 py-1.5 text-ink [--glass-bg:color-mix(in_srgb,var(--color-orange-soft)_70%,white)] [--glass-border:rgba(255,107,26,.18)]">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
