"use client";

import { ArrowDown, ArrowUpRight, Play } from "lucide-react";
import { useRef } from "react";
import { gsap, isDesktop, prefersReducedMotion, useGSAP } from "@/components/motion/gsap";
import { Counter } from "@/components/motion/counter";
import { Button } from "@/components/ui/button";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { useApplyDialog } from "@/components/site/apply-dialog";

interface Props {
  stats: { students: string; courses: string; projects: string };
  heroImage?: string | null;
}

/**
 * Signature hero: editorial headline on the left, an "ecosystem" composition on the right —
 * code, AI, robotics and content tiles orbiting a real-photo slot. Entrance timeline + cursor parallax.
 */
export function Hero({ stats, heroImage }: Props) {
  const root = useRef<HTMLElement>(null);
  const { open } = useApplyDialog();

  useGSAP(
    () => {
      const el = root.current!;
      const reduced = prefersReducedMotion();
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      const words = el.querySelectorAll<HTMLElement>("[data-hero-word]");
      const tiles = el.querySelectorAll<HTMLElement>("[data-tile]");

      if (reduced) {
        gsap.set([words, tiles, "[data-hero-fade]"], { clearProps: "all", opacity: 1 });
        return;
      }

      gsap.set(words, { yPercent: 110, rotate: 3 });
      gsap.set("[data-hero-fade]", { opacity: 0, y: 16 });
      gsap.set(tiles, { opacity: 0, y: 40, scale: 0.94 });
      gsap.set("[data-hero-photo]", { clipPath: "inset(12% 12% 12% 12% round 28px)", scale: 1.08 });

      tl.to(words, { yPercent: 0, rotate: 0, duration: 1.2, stagger: 0.06 }, 0.1)
        .to("[data-hero-fade]", { opacity: 1, y: 0, duration: 0.9, stagger: 0.08 }, 0.5)
        .to("[data-hero-photo]", { clipPath: "inset(0% 0% 0% 0% round 28px)", scale: 1, duration: 1.4 }, 0.3)
        .to(tiles, { opacity: 1, y: 0, scale: 1, duration: 1.1, stagger: 0.09 }, 0.7);

      // Floating idle motion — transform only
      tiles.forEach((t, i) => {
        gsap.to(t, { y: `+=${8 + (i % 3) * 4}`, duration: 3 + i * 0.4, yoyo: true, repeat: -1, ease: "sine.inOut", delay: 1.8 });
      });

      // Phones/tablets: depth layers drift with scroll instead of the cursor.
      if (!isDesktop()) {
        el.querySelectorAll<HTMLElement>("[data-depth]").forEach((l) => {
          const depth = Number(l.dataset.depth);
          gsap.to(l, { yPercent: -14 * depth, ease: "none", scrollTrigger: { trigger: el, start: "top top", end: "bottom top", scrub: 0.6 } });
        });
        return;
      }
      const scene = el.querySelector<HTMLElement>("[data-scene]")!;
      const layers = el.querySelectorAll<HTMLElement>("[data-depth]");
      const xs = Array.from(layers).map((l) => gsap.quickTo(l, "x", { duration: 0.8, ease: "power3" }));
      const ys = Array.from(layers).map((l) => gsap.quickTo(l, "y", { duration: 0.8, ease: "power3" }));
      const onMove = (e: MouseEvent) => {
        const r = scene.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        layers.forEach((l, i) => {
          const depth = Number(l.dataset.depth);
          xs[i](dx * depth * 24);
          ys[i](dy * depth * 18);
        });
      };
      el.addEventListener("mousemove", onMove);
      return () => el.removeEventListener("mousemove", onMove);
    },
    { scope: root },
  );

  const headline = ["Kelajak", "kasblarini", "bugundan", "oʻrganing."];

  return (
    <section ref={root} className="relative overflow-hidden pt-32 pb-16 sm:pt-36 lg:pt-40 lg:pb-24" aria-labelledby="hero-title">
      {/* Ambient orange light — the "energy" of the brand */}
      <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] h-[70vh] w-[60vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.22),transparent)] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-1/2 left-[-20%] h-[50vh] w-[40vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,178,122,.25),transparent)] blur-3xl" />

      <div className="container-x grid items-center gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-6">
          <h1 id="hero-title" className="t-display" aria-label={headline.join(" ")}>
            {headline.map((w, i) => (
              <span key={w} className="inline-block overflow-hidden pb-[0.06em] align-top" aria-hidden>
                <span data-hero-word className={i === 1 ? "inline-block text-orange" : "inline-block"}>
                  {w}
                </span>
                {i < headline.length - 1 ? " " : null}
              </span>
            ))}
          </h1>
          <p data-hero-fade className="t-lead mt-6 max-w-lg">
            Amaliy bilim, zamonaviy texnologiyalar va real loyihalar orqali yangi kasbni egallang.
          </p>
          <div data-hero-fade className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" href="/kurslar" magnetic icon={<ArrowUpRight size={18} />}>
              Kurslarni koʻrish
            </Button>
            <Button size="lg" variant="ghost" onClick={() => open()} icon={<ArrowDown size={18} className="rotate-[-90deg]" />}>
              Bepul konsultatsiya
            </Button>
          </div>

          <dl data-hero-fade className="mt-12 grid max-w-md grid-cols-3 gap-3">
            {[
              { v: stats.students, l: "oʻquvchi" },
              { v: stats.courses, l: "yoʻnalish" },
              { v: stats.projects, l: "real loyiha" },
            ].map((s) => (
              <div key={s.l} className="glass rounded-(--radius-lg) px-4 py-3">
                <dt className="t-meta order-2 text-(--fg-muted)">{s.l}</dt>
                <dd className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  <Counter value={s.v} />
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Ecosystem scene */}
        <div className="relative lg:col-span-6" data-scene>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[520px] sm:aspect-[5/5.4]">
            {/* Photo slot */}
            <div data-hero-photo data-depth="0.4" className="absolute inset-x-[10%] top-[6%] bottom-[6%] overflow-hidden rounded-[28px] shadow-lg will-change-transform">
              <PlaceholderImage src={heroImage} alt="EduTech oʻquvchilari amaliy dars jarayonida" className="h-full w-full" priority sizes="(min-width:1024px) 40vw, 90vw" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent" aria-hidden />
            </div>

            {/* Code tile */}
            <div data-tile data-depth="1" className="glass absolute top-[2%] left-0 w-[52%] rounded-(--radius-lg) p-4 will-change-transform">
              <p className="t-meta mb-2 flex items-center gap-2 text-(--fg-muted)">
                <span className="size-2 rounded-full bg-orange" /> app.tsx
              </p>
              <pre className="font-mono text-[11px] leading-relaxed text-ink sm:text-xs">
                <code>{`const kasb = await\n  edutech.learn("dev")\n// → Junior Developer`}</code>
              </pre>
            </div>

            {/* AI tile */}
            <div data-tile data-depth="1.4" className="glass absolute right-0 bottom-[6%] w-[46%] rounded-(--radius-lg) p-4 will-change-transform sm:top-[38%] sm:bottom-auto">
              <p className="t-meta mb-3 text-(--fg-muted)">AI model · training</p>
              <div className="flex items-end gap-1" aria-hidden>
                {[40, 65, 50, 80, 62, 92, 74, 100].map((h, i) => (
                  <span key={i} className="w-full rounded-sm bg-orange/80" style={{ height: `${h * 0.32}px`, opacity: 0.35 + i * 0.08 }} />
                ))}
              </div>
              <p className="mt-2 font-display text-2xl font-bold">87%</p>
            </div>

            {/* Reel tile */}
            <div data-tile data-depth="0.8" className="absolute bottom-[4%] left-[2%] w-[30%] overflow-hidden rounded-(--radius-lg) bg-ink text-white shadow-lg will-change-transform">
              <div className="placeholder-surface aspect-[9/14]" data-world="media">
                <div className="absolute inset-0 grid place-items-center">
                  <span className="grid size-10 place-items-center rounded-full bg-white/90 text-ink">
                    <Play size={16} fill="currentColor" />
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="t-meta text-white/70">Reels</p>
                  <p className="text-sm font-semibold">Mobilografiya</p>
                </div>
              </div>
            </div>

            {/* Robotics tile */}
            <div data-tile data-depth="1.2" className="glass absolute right-[2%] bottom-[8%] hidden w-[42%] rounded-(--radius-lg) p-4 will-change-transform sm:block">
              <p className="t-meta mb-2 text-(--fg-muted)">Robot · sensor</p>
              <svg viewBox="0 0 120 40" className="h-10 w-full text-orange" aria-hidden>
                <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" points="0,30 12,28 22,12 34,26 46,18 58,32 70,10 84,24 96,16 108,28 120,14" />
              </svg>
              <p className="mt-1 text-xs font-semibold">Arduino · toʻsiq 12 sm</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
