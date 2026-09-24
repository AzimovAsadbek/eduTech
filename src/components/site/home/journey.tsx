"use client";

import { BookOpen, Repeat, Rocket, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef } from "react";
import { gsap, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/components/motion/gsap";
import { Eyebrow } from "@/components/ui/eyebrow";

const ICONS = [BookOpen, Repeat, Rocket, TrendingUp];

interface Step {
  n: string;
  key: string;
  title: string;
  text: string;
  detail: string;
}

/**
 * DISCOVERY: the education model as a four-step process anyone can read at a glance.
 * Desktop: four cards in a row under a progress track that fills left→right on scroll; cards light up in order.
 * Mobile: a vertical timeline whose rail fills with scroll, a glowing marker rides along it and each step pops in.
 */
export function Journey() {
  const t = useTranslations("journey");
  const steps = t.raw("steps") as Step[];
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      if (prefersReducedMotion()) {
        el.querySelectorAll<HTMLElement>("[data-step]").forEach((s) => (s.dataset.active = ""));
        return;
      }
      const mm = gsap.matchMedia();

      mm.add("(min-width: 1024px)", () => {
        const cards = el.querySelectorAll<HTMLElement>("[data-d-card]");
        const nodes = el.querySelectorAll<HTMLElement>("[data-d-node]");
        const track = el.querySelector<HTMLElement>("[data-d-track]")!;
        const glow = el.querySelector<HTMLElement>("[data-d-glow]")!;
        gsap.set(cards, { opacity: 0, y: 36, rotateX: -8, transformPerspective: 900, transformOrigin: "50% 0%" });
        // Cards enter one after another once the block is in view…
        const enter = gsap.to(cards, { opacity: 1, y: 0, rotateX: 0, duration: 0.9, ease: "expo.out", stagger: 0.14, paused: true });
        ScrollTrigger.create({ trigger: el, start: "top 70%", once: true, onEnter: () => enter.play() });
        // …and the track fills while the section scrolls through, lighting each step in turn.
        gsap.fromTo(glow, { left: "0%" }, { left: "100%", ease: "none", scrollTrigger: { trigger: el, start: "top 60%", end: "bottom 70%", scrub: 0.4 } });
        gsap.fromTo(track, { scaleX: 0 }, {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 60%",
            end: "bottom 70%",
            scrub: 0.4,
            onUpdate: (self) => {
              const idx = Math.min(steps.length - 1, Math.floor(self.progress * steps.length + 0.2));
              nodes.forEach((n, i) => (i <= idx ? (n.dataset.active = "") : delete n.dataset.active));
              cards.forEach((c, i) => (i <= idx ? (c.dataset.active = "") : delete c.dataset.active));
            },
          },
        });
      });

      mm.add("(max-width: 1023px)", () => {
        const list = el.querySelector<HTMLElement>("[data-m-list]")!;
        const rail = el.querySelector<HTMLElement>("[data-m-rail]")!;
        const marker = el.querySelector<HTMLElement>("[data-m-marker]")!;
        const items = el.querySelectorAll<HTMLElement>("[data-step]");
        // Rail + glowing marker follow the scroll position through the list.
        gsap.fromTo(rail, { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: list, start: "top 65%", end: "bottom 75%", scrub: 0.3 } });
        gsap.fromTo(marker, { top: "0%" }, { top: "100%", ease: "none", scrollTrigger: { trigger: list, start: "top 65%", end: "bottom 75%", scrub: 0.3 } });
        items.forEach((it) => {
          const num = it.querySelector<HTMLElement>("[data-m-num]")!;
          const card = it.querySelector<HTMLElement>("[data-m-card]")!;
          const tl = gsap.timeline({ paused: true })
            .fromTo(card, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: 0.55, ease: "expo.out" }, 0)
            .fromTo(num, { scale: 0.7 }, { scale: 1, duration: 0.5, ease: "back.out(2.5)" }, 0);
          ScrollTrigger.create({
            trigger: it,
            start: "top 72%",
            once: true,
            onEnter: () => {
              it.dataset.active = "";
              tl.play();
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
      <div className="container-x">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow className="mb-4">{t("eyebrow")}</Eyebrow>
            <h2 id="journey-title" className="t-h2">
              {t("title")} <span className="text-orange">{t("titleAccent")}</span>
            </h2>
          </div>
          <p className="t-lead lg:col-span-4 lg:col-start-9">{t("lead")}</p>
        </div>

        {/* Desktop: process row */}
        <div className="mt-14 hidden lg:block">
          <div className="relative mx-[12.5%] h-px bg-(--line)">
            <div data-d-track className="absolute inset-0 origin-left scale-x-0 bg-orange" aria-hidden />
            <span data-d-glow className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange shadow-[0_0_0_6px_rgba(255,107,26,.18),0_0_28px_rgba(255,107,26,.9)]" aria-hidden />
            {steps.map((s, i) => (
              <span
                key={s.n}
                data-d-node
                className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-muted-2 transition-[background-color,transform] duration-300 data-[active]:scale-125 data-[active]:bg-orange"
                style={{ left: `${(i / (steps.length - 1)) * 100}%` }}
                aria-hidden
              />
            ))}
          </div>
          <ol className="mt-8 grid grid-cols-4 gap-5">
            {steps.map((s, i) => {
              const Icon = ICONS[i] ?? BookOpen;
              return (
                <li
                  key={s.n}
                  data-d-card
                  className="group relative flex flex-col overflow-hidden rounded-(--radius-xl) border border-(--line) bg-paper p-6 transition-[border-color,box-shadow,transform] duration-500 hover:-translate-y-1 data-[active]:-translate-y-1 data-[active]:border-orange/40 data-[active]:shadow-[0_24px_48px_-24px_rgba(255,107,26,.35)] before:absolute before:inset-x-0 before:top-0 before:h-1 before:origin-left before:scale-x-0 before:bg-orange before:transition-transform before:duration-500 before:ease-[var(--ease-out)] data-[active]:before:scale-x-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-3xl font-bold text-muted-2 transition-colors duration-300 group-data-[active]:text-orange">{s.n}</span>
                    <span className="grid size-11 place-items-center rounded-full bg-orange-soft text-orange transition-colors duration-300 group-data-[active]:bg-orange group-data-[active]:text-white">
                      <Icon size={20} />
                    </span>
                  </div>
                  <p className="t-meta mt-6 text-(--fg-muted)">{s.key}</p>
                  <h3 className="t-h3 mt-1">{s.title}</h3>
                  <p className="mt-3 flex-1 text-(--fg-muted)">{s.text}</p>
                  <p className="t-meta mt-6 inline-flex w-fit rounded-full bg-orange-soft px-3 py-1.5 text-ink">{s.detail}</p>
                </li>
              );
            })}
          </ol>
        </div>

        {/* Mobile / tablet: timeline with a travelling marker */}
        <ol data-m-list className="relative mt-10 lg:hidden">
          <div className="absolute top-4 bottom-4 left-[1.35rem] w-px bg-(--line)" aria-hidden />
          <div data-m-rail className="absolute top-4 bottom-4 left-[1.35rem] w-0.5 origin-top rounded-full bg-[linear-gradient(180deg,#ffb27a,#ff6b1a)]" aria-hidden />
          <div className="absolute top-4 bottom-4 left-[1.35rem]" aria-hidden>
            <span data-m-marker className="absolute left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange shadow-[0_0_0_6px_rgba(255,107,26,.2),0_0_28px_rgba(255,107,26,.9)] animate-pulse-soft" />
          </div>
          {steps.map((s, i) => {
            const Icon = ICONS[i] ?? BookOpen;
            return (
              <li key={s.n} data-step className="group relative grid grid-cols-[2.75rem_1fr] gap-4 py-4">
                <span data-m-num className="font-display relative z-10 grid size-11 place-items-center rounded-full border border-(--line) bg-paper text-base font-semibold transition-[background-color,color,border-color] duration-300 group-data-[active]:border-orange group-data-[active]:bg-orange group-data-[active]:text-white">
                  {s.n}
                </span>
                <div data-m-card className="glass rounded-(--radius-xl) p-5 transition-[box-shadow] duration-500 group-data-[active]:shadow-[0_20px_40px_-24px_rgba(255,107,26,.5)]">
                  <div className="flex items-center justify-between">
                    <p className="t-eyebrow text-orange">{s.key}</p>
                    <span className="grid size-9 place-items-center rounded-full bg-orange-soft text-orange">
                      <Icon size={16} />
                    </span>
                  </div>
                  <h3 className="t-h3 mt-2">{s.title}</h3>
                  <p className="mt-2 text-(--fg-muted)">{s.text}</p>
                  <p className="t-meta mt-4 inline-flex rounded-full bg-orange-soft px-3 py-1.5 text-ink">{s.detail}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
