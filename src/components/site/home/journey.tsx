"use client";

import { useRef } from "react";
import { gsap, isDesktop, prefersReducedMotion, ScrollTrigger, useGSAP } from "@/components/motion/gsap";
import { SectionHeading } from "@/components/ui/section-heading";
import { cn } from "@/lib/utils";

const steps = [
  { n: "01", key: "Learn", title: "Oʻrganish", text: "Mentor bilan jonli darslar. Nazariya faqat amaliyot uchun kerak boʻlgan darajada.", detail: "Haftasiga 2–3 dars · kichik guruhlar" },
  { n: "02", key: "Practice", title: "Mashq qilish", text: "Har bir dars — vazifa. Har bir hafta — kichik loyiha. Xato qilish mumkin, toʻxtash mumkin emas.", detail: "Kod-review · feedback · retake" },
  { n: "03", key: "Build", title: "Yaratish", text: "Real mijoz yoki real muammo uchun mahsulot yaratasiz. Bu portfolio, sertifikat emas.", detail: "Diplom loyihasi · jamoaviy ish" },
  { n: "04", key: "Grow", title: "Oʻsish", text: "Ishga joylashish, freelance yoki oʻz loyihangiz. Biz bitiruvdan keyin ham yonma-yon qolamiz.", detail: "Karyera yordami · community" },
];

/**
 * DISCOVERY: the education model as a pinned, scroll-driven journey on desktop
 * (a rail fills as steps swap), and a plain vertical timeline on mobile.
 */
export function Journey() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion() || !isDesktop()) return;
      const el = root.current!;
      const panels = el.querySelectorAll<HTMLElement>("[data-step]");
      const rail = el.querySelector<HTMLElement>("[data-rail]")!;
      const nums = el.querySelectorAll<HTMLElement>("[data-num]");

      gsap.set(panels, { opacity: 0, y: 30 });
      gsap.set(panels[0], { opacity: 1, y: 0 });
      gsap.set(nums[0], { color: "#111" });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el.querySelector("[data-pin]"),
          start: "top top+=96",
          end: `+=${panels.length * 70}%`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
        },
      });
      tl.to(rail, { scaleY: 1, ease: "none", duration: panels.length }, 0);
      panels.forEach((p, i) => {
        if (i === 0) return;
        tl.to(panels[i - 1], { opacity: 0, y: -30, duration: 0.5 }, i - 0.25)
          .to(nums[i - 1], { color: "#a3a3a3", duration: 0.3 }, i - 0.25)
          .to(p, { opacity: 1, y: 0, duration: 0.5 }, i)
          .to(nums[i], { color: "#111", duration: 0.3 }, i);
      });
      return () => ScrollTrigger.getAll().forEach((t) => t.trigger === el.querySelector("[data-pin]") && t.kill());
    },
    { scope: root },
  );

  return (
    <section ref={root} className="section-y relative" aria-labelledby="journey-title">
      <div className="container-x">
        <SectionHeading eyebrow="Taʼlim modeli" title={<span id="journey-title">Bilimdan koʻnikmaga. <span className="text-orange">Koʻnikmadan kasbga.</span></span>} lead="Toʻrt bosqich. Har biri oldingisidan oʻsib chiqadi — nazariyadan real kasbgacha." align="split" />

        {/* Desktop: pinned */}
        <div data-pin className="mt-16 hidden lg:grid lg:min-h-[60vh] lg:grid-cols-12 lg:gap-8">
          <div className="relative col-span-4 flex flex-col justify-between py-2">
            <div className="absolute top-0 bottom-0 left-[1.35rem] w-px bg-(--line)" aria-hidden />
            <div data-rail className="absolute top-0 bottom-0 left-[1.35rem] w-px origin-top scale-y-0 bg-orange" aria-hidden />
            {steps.map((s) => (
              <div key={s.n} className="relative flex items-center gap-6 py-6">
                <span data-num className="font-display relative z-10 grid size-11 place-items-center rounded-full border border-(--line) bg-paper text-base font-semibold text-muted-2">
                  {s.n}
                </span>
                <span className="t-meta text-(--fg-muted)">{s.key}</span>
              </div>
            ))}
          </div>
          <div className="relative col-span-7 col-start-6">
            {steps.map((s, i) => (
              <article key={s.n} data-step className={cn("absolute inset-0 flex flex-col justify-center", i !== 0 && "opacity-0")} aria-hidden={i !== 0}>
                <p className="t-eyebrow text-orange">
                  {s.n} — {s.key}
                </p>
                <h3 className="t-h1 mt-4">{s.title}</h3>
                <p className="t-lead mt-6 max-w-xl">{s.text}</p>
                <p className="t-meta mt-8 inline-flex w-fit rounded-full bg-orange-soft px-3 py-2 text-ink">{s.detail}</p>
              </article>
            ))}
          </div>
        </div>

        {/* Mobile / tablet: vertical timeline */}
        <ol className="mt-12 space-y-10 lg:hidden">
          {steps.map((s) => (
            <li key={s.n} className="relative grid grid-cols-[2.75rem_1fr] gap-4">
              <span className="font-display grid size-11 place-items-center rounded-full border border-(--line) text-base font-semibold">{s.n}</span>
              <div>
                <p className="t-eyebrow text-orange">{s.key}</p>
                <h3 className="t-h3 mt-2">{s.title}</h3>
                <p className="mt-3 text-(--fg-muted)">{s.text}</p>
                <p className="t-meta mt-4 inline-flex rounded-full bg-orange-soft px-3 py-2 text-ink">{s.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
