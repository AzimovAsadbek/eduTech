import { ArrowUpRight, Play } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { Counter } from "@/components/motion/counter";
import { Button } from "@/components/ui/button";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { routes } from "@/config/site";
import { HeroConsultButton, HeroParallax } from "./hero-client";

interface Props {
  stats: { students: string; courses: string; projects: string };
  heroImage?: string | null;
}

/** CSS custom properties used by the hero's keyframes (globals.css, "Hero"). */
const vars = (v: Record<string, string | number>) => v as CSSProperties;

/**
 * Signature hero: editorial headline on the left, an "ecosystem" composition on the right —
 * code, AI, robotics and content tiles orbiting a real-photo slot.
 *
 * Server-rendered. The entrance is pure CSS and starts with the first paint, so the copy never waits for
 * JavaScript (the lead paragraph is the LCP element on phones: it only rises, it is never hidden). Tiles
 * float on CSS keyframes; on phones the layers drift with the scroll through a CSS scroll timeline.
 * The only scripts are two islands: the consultation button and the desktop cursor parallax.
 */
export function Hero({ stats, heroImage }: Props) {
  const t = useTranslations("hero");
  const tc = useTranslations("common");

  const headline = t("headline").split(" ");
  const accent = t.raw("accent") as string[];
  const isAccent = (w: string) => accent.includes(w) || accent.includes(w.replace(/[.,!?]/g, ""));

  return (
    <section id="hero" className="relative overflow-hidden pt-32 pb-16 sm:pt-36 lg:pt-40 lg:pb-24" aria-labelledby="hero-title">
      <HeroParallax rootId="hero" />
      {/* Ambient orange light — the "energy" of the brand */}
      <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] h-[70vh] w-[60vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.22),transparent)] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-1/2 left-[-20%] h-[50vh] w-[40vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,178,122,.25),transparent)] blur-3xl" />

      <div className="container-x grid items-center gap-14 lg:grid-cols-12 lg:gap-8">
        <div className="min-w-0 lg:col-span-6">
          <h1 id="hero-title" className="t-display" aria-label={t("headline")}>
            {headline.map((w, i) => (
              <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-[0.06em] align-top" aria-hidden>
                <span data-hero-word className={isAccent(w) ? "inline-block text-orange" : "inline-block"} style={vars({ "--i": i })}>
                  {w}
                </span>
                {i < headline.length - 1 ? " " : null}
              </span>
            ))}
          </h1>
          <p data-hero-rise className="t-lead mt-6 max-w-lg" style={vars({ "--i": 0 })}>
            {t("lead")}
          </p>
          <div data-hero-rise className="mt-8 flex flex-wrap items-center gap-3" style={vars({ "--i": 1 })}>
            <Button size="lg" href={routes.courses} magnetic icon={<ArrowUpRight size={18} />}>
              {tc("actions.viewCourses")}
            </Button>
            <HeroConsultButton label={tc("actions.consult")} />
          </div>

          <dl data-hero-rise className="mt-12 grid max-w-md grid-cols-3 gap-3" style={vars({ "--i": 2 })}>
            {[
              { v: stats.students, l: tc("stats.students") },
              { v: stats.courses, l: tc("stats.courses") },
              { v: stats.projects, l: tc("stats.projects") },
            ].map((s) => (
              <div key={s.l} className="glass rounded-(--radius-lg) px-4 py-3">
                {/* Phones: labels always reserve two lines. "real loyiha" sits right at the wrap edge, so the late
                    mono-font swap would otherwise change the card height and shift the scene below. */}
                <dt className="t-meta text-(--fg-muted) max-sm:min-h-[2lh]">{s.l}</dt>
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
            <div data-hero-photo data-depth="0.4" style={vars({ "--depth": 0.4 })} className="absolute inset-x-[10%] top-[6%] bottom-[6%] overflow-hidden rounded-[28px] shadow-lg lg:will-change-transform">
              <PlaceholderImage src={heroImage} alt={t("photoAlt")} className="h-full w-full" priority sizes="(min-width:1024px) 40vw, 90vw" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/35 to-transparent" aria-hidden />
            </div>

            {/* Code tile */}
            <div data-tile data-depth="1" style={vars({ "--i": 0, "--depth": 1, "--float-y": "8px", "--float-dur": "3s" })} className="glass absolute top-[2%] left-0 w-[52%] rounded-(--radius-lg) p-4 lg:will-change-transform">
              <p className="t-meta mb-2 flex items-center gap-2 text-(--fg-muted)">
                <span className="size-2 rounded-full bg-orange" /> {t("tiles.codeFile")}
              </p>
              <pre className="font-mono text-[11px] leading-relaxed text-ink sm:text-xs">
                <code>{t("tiles.code")}</code>
              </pre>
            </div>

            {/* AI tile */}
            <div data-tile data-depth="1.4" style={vars({ "--i": 1, "--depth": 1.4, "--float-y": "12px", "--float-dur": "3.4s" })} className="glass absolute right-0 bottom-[6%] w-[46%] rounded-(--radius-lg) p-4 sm:top-[38%] sm:bottom-auto lg:will-change-transform">
              <p className="t-meta mb-3 text-(--fg-muted)">{t("tiles.ai")}</p>
              <div className="flex items-end gap-1" aria-hidden>
                {[40, 65, 50, 80, 62, 92, 74, 100].map((h, i) => (
                  <span key={i} className="w-full rounded-sm bg-orange/80" style={{ height: `${h * 0.32}px`, opacity: 0.35 + i * 0.08 }} />
                ))}
              </div>
              <p className="mt-2 font-display text-2xl font-bold">87%</p>
            </div>

            {/* Reel tile */}
            <div data-tile data-depth="0.8" style={vars({ "--i": 2, "--depth": 0.8, "--float-y": "16px", "--float-dur": "3.8s" })} className="absolute bottom-[4%] left-[2%] w-[30%] overflow-hidden rounded-(--radius-lg) bg-ink text-white shadow-lg lg:will-change-transform">
              <div className="placeholder-surface aspect-[9/14]" data-world="media">
                <div className="absolute inset-0 grid place-items-center">
                  <span className="grid size-10 place-items-center rounded-full bg-white/90 text-ink">
                    <Play size={16} fill="currentColor" />
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="t-meta text-white/70">{t("tiles.reels")}</p>
                  <p className="text-sm font-semibold">{t("tiles.reelsTitle")}</p>
                </div>
              </div>
            </div>

            {/* Robotics tile */}
            <div data-tile data-depth="1.2" style={vars({ "--i": 3, "--depth": 1.2, "--float-y": "8px", "--float-dur": "4.2s" })} className="glass absolute right-[2%] bottom-[8%] hidden w-[42%] rounded-(--radius-lg) p-4 sm:block lg:will-change-transform">
              <p className="t-meta mb-2 text-(--fg-muted)">{t("tiles.robot")}</p>
              <svg viewBox="0 0 120 40" className="h-10 w-full text-orange" aria-hidden>
                <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" points="0,30 12,28 22,12 34,26 46,18 58,32 70,10 84,24 96,16 108,28 120,14" />
              </svg>
              <p className="mt-1 text-xs font-semibold">{t("tiles.robotValue")}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
