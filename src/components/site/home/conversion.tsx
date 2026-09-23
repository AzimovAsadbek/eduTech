"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Eyebrow } from "@/components/ui/eyebrow";
import { LeadForm, type LeadFormOption } from "@/components/site/lead-form";
import { ContactLink } from "@/components/site/contact-link";
import type { SiteSettings } from "@/server/modules/settings/service";

interface Props {
  courses: LeadFormOption[];
  services: LeadFormOption[];
  branches: LeadFormOption[];
  settings: SiteSettings;
  defaultTab?: "EDUCATION" | "MEDIA";
}

/** CONVERSION: one section, two paths. Glass card on a warm ambient wash + contact facts. */
export function Conversion({ courses, services, branches, settings, defaultTab = "EDUCATION" }: Props) {
  const [tab, setTab] = useState<"EDUCATION" | "MEDIA">(defaultTab);
  return (
    <section id="ariza" className="section-y relative overflow-hidden bg-orange-soft" aria-labelledby="apply-title">
      <div id="media-inquiry" className="absolute -top-24" aria-hidden />
      <div aria-hidden className="pointer-events-none absolute -top-1/3 -right-1/4 size-[70vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.35),transparent)] blur-3xl" />
      <div className="container-x relative grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow className="mb-4">Boshlaymizmi?</Eyebrow>
          <h2 id="apply-title" className="t-h1">
            Bir qadam — <span className="text-orange">bir ariza.</span>
          </h2>
          <p className="t-lead mt-5 max-w-md">Kurs tanlashda yordam kerakmi yoki brendingiz uchun kontent? Yozing — bir ish kuni ichida javob beramiz.</p>

          <dl className="mt-10 space-y-5">
            <div>
              <dt className="t-meta text-(--fg-muted)">Manzil</dt>
              <dd className="mt-1 font-semibold">{settings.city}{settings.address ? `, ${settings.address}` : ""}</dd>
            </div>
            {settings.phone ? (
              <div>
                <dt className="t-meta text-(--fg-muted)">Telefon</dt>
                <dd className="mt-1 font-semibold">
                  <ContactLink kind="phone" href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-orange">
                    {settings.phone}
                  </ContactLink>
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="t-meta text-(--fg-muted)">Ish vaqti</dt>
              <dd className="mt-1 font-semibold">{settings.workingHours}</dd>
            </div>
            <div className="flex gap-3 pt-2">
              {settings.telegram ? (
                <ContactLink kind="telegram" href={settings.telegram} className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:border-orange hover:text-orange">
                  Telegram
                </ContactLink>
              ) : null}
              {settings.instagram ? (
                <ContactLink kind="instagram" href={settings.instagram} className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold hover:border-orange hover:text-orange">
                  Instagram
                </ContactLink>
              ) : null}
            </div>
          </dl>
        </div>

        <div className="glass relative rounded-(--radius-xl) p-6 sm:p-8 lg:col-span-7">
          <div role="tablist" aria-label="Ariza turi" className="mb-6 grid grid-cols-2 rounded-full bg-ink/5 p-1">
            {(
              [
                ["EDUCATION", "Kursga yozilish"],
                ["MEDIA", "Media xizmat"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                role="tab"
                type="button"
                aria-selected={tab === k}
                onClick={() => setTab(k)}
                className={cn("h-11 rounded-full text-sm font-semibold transition-colors duration-300", tab === k ? "bg-ink text-white shadow-md" : "text-ink/70 hover:text-ink")}
              >
                {l}
              </button>
            ))}
          </div>
          {tab === "EDUCATION" ? (
            <LeadForm key="edu" type="EDUCATION" courses={courses} branches={branches} source="home:apply" submitLabel="Ariza yuborish" />
          ) : (
            <LeadForm key="media" type="MEDIA" services={services} source="home:media-inquiry" submitLabel="Soʻrov yuborish" />
          )}
        </div>
      </div>
    </section>
  );
}
