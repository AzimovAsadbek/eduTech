"use client";

import { Link } from "@/i18n/navigation";
import { ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, type CSSProperties } from "react";
import type { Service } from "@prisma/client";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { routes } from "@/config/site";
import { cn, pad2 } from "@/lib/utils";

/**
 * Interactive service explorer: a list on the left drives a live detail panel on the right.
 * On mobile it collapses into an accordion so nothing is hidden behind hover.
 */
export function ServiceExplorer({ services }: { services: Service[] }) {
  const t = useTranslations("serviceExplorer");
  const tc = useTranslations("common.actions");
  const [activeId, setActiveId] = useState(services[0]?.id ?? "");
  const active = services.find((s) => s.id === activeId) ?? services[0];
  // The panel content is keyed by the active service, so its CSS rise (globals.css, [data-anim]) replays on every switch.
  const step = (i: number) => ({ "--i": i }) as CSSProperties;

  if (!active) return null;

  return (
    <section data-world="media" data-nav="/media" className="section-y bg-(--surface) text-white" aria-labelledby="services-title">
      <div className="container-x">
        <SectionHeading eyebrow={t("eyebrow")} title={<span id="services-title">{t("title")}</span>} lead={t("lead")} align="split" />

        {/* Desktop split panel */}
        <div className="mt-14 hidden gap-8 lg:grid lg:grid-cols-12">
          <ul className="lg:col-span-5" role="tablist" aria-label={tc("mediaServices")} aria-orientation="vertical">
            {services.map((s, i) => {
              const isActive = s.id === activeId;
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls="service-panel"
                    onMouseEnter={() => setActiveId(s.id)}
                    onFocus={() => setActiveId(s.id)}
                    onClick={() => setActiveId(s.id)}
                    className={cn(
                      "group flex w-full items-center gap-5 border-t border-white/10 py-4 text-left transition-colors duration-300",
                      isActive ? "text-white" : "text-white/45 hover:text-white/80",
                    )}
                  >
                    <span className="t-meta w-8">{pad2(i + 1)}</span>
                    <span className="t-h3 flex-1">{s.title}</span>
                    <span
                      className={cn(
                        "bg-orange h-px w-8 origin-left transition-transform duration-500 ease-[var(--ease-out)]",
                        isActive ? "scale-x-100" : "scale-x-0",
                      )}
                      aria-hidden
                    />
                  </button>
                </li>
              );
            })}
          </ul>

          <div id="service-panel" role="tabpanel" className="glass relative overflow-hidden rounded-(--radius-xl) p-10 lg:col-span-7">
            <div aria-hidden className="bg-orange/30 pointer-events-none absolute -top-24 -right-24 size-72 rounded-full blur-3xl" />
            <div key={active.id} className="relative">
              <p data-anim style={step(0)} className="t-eyebrow text-orange">
                {t("panelEyebrow")}
              </p>
              <h3 data-anim style={step(1)} className="t-h1 mt-3">
                {active.title}
              </h3>
              <p data-anim style={step(2)} className="t-lead mt-4 max-w-lg text-white/70">
                {active.tagline}
              </p>
              <ul data-anim style={step(3)} className="mt-8 flex flex-wrap gap-2">
                {active.attributes.map((a) => (
                  <li key={a} className="t-meta rounded-full border border-white/15 px-3 py-1.5 text-white/80">
                    {a}
                  </li>
                ))}
              </ul>
              {active.deliverables.length ? (
                <ul data-anim style={step(4)} className="mt-8 grid gap-2 border-t border-white/10 pt-6 text-white/80 sm:grid-cols-2">
                  {active.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm">
                      <span className="bg-orange mt-2 size-1.5 shrink-0 rounded-full" aria-hidden />
                      {d}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div data-anim style={step(5)} className="mt-10 flex flex-wrap gap-3">
                <Link
                  href={routes.service(active.slug)}
                  className="text-ink hover:bg-orange inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 font-semibold transition-colors hover:text-white"
                >
                  {t("explore")} <ArrowUpRight size={16} />
                </Link>
                <a
                  href="#media-inquiry"
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-white/25 px-5 font-semibold text-white transition-colors hover:border-white"
                >
                  {tc("order")}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile / tablet: scannable service cards */}
        <Reveal stagger={0.05} as="ul" className="mt-10 grid gap-3 sm:grid-cols-2 lg:hidden">
          {services.map((s, i) => (
            <li key={s.id}>
              <Link
                href={routes.service(s.slug)}
                className="glass group flex h-full flex-col rounded-(--radius-xl) p-5 transition-transform duration-300 [--glass-bg:rgba(255,255,255,.05)] active:scale-[0.98]"
              >
                <div className="flex items-center justify-between">
                  <span className="t-meta text-white/45">{pad2(i + 1)}</span>
                  <span className="bg-orange grid size-9 place-items-center rounded-full text-white">
                    <ArrowUpRight size={16} />
                  </span>
                </div>
                <h3 className="t-h4 mt-5 text-white">{s.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-white/65">{s.tagline}</p>
                {s.attributes.length ? (
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {s.attributes.slice(0, 3).map((a) => (
                      <li key={a} className="t-meta rounded-full border border-white/15 px-2.5 py-1 text-white/75">
                        {a}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Link>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
