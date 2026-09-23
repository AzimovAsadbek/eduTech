import type { Metadata } from "next";
import { Clock, MapPin, Phone, Send } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ContactLink } from "@/components/site/contact-link";
import { JsonLd, breadcrumbJsonLd, organizationJsonLd } from "@/components/site/json-ld";
import { LeadForm } from "@/components/site/lead-form";
import { PageHeader } from "@/components/site/page-header";
import { getActiveBranches } from "@/server/modules/content/public";
import { getSiteSettings } from "@/server/modules/settings/service";

export const metadata: Metadata = {
  title: "Kontakt — Namangan",
  description: "EduTech bilan bogʻlaning: Namangan, telefon, Telegram, Instagram, ish vaqti va manzil xaritada.",
  alternates: { canonical: "/kontakt" },
};

export default async function ContactPage() {
  const [settings, branches] = await Promise.all([getSiteSettings(), getActiveBranches()]);
  const mapUrl = settings.mapEmbedUrl || branches.find((b) => b.mapUrl)?.mapUrl || "";
  return (
    <>
      <JsonLd data={organizationJsonLd(settings)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Bosh sahifa", path: "/" }, { name: "Kontakt", path: "/kontakt" }])} />
      <PageHeader eyebrow="Kontakt" title="Keling, gaplashamiz." accent={["gaplashamiz."]} lead="Kurs, media xizmat yoki hamkorlik — bir xabar yetarli. Ish kunlari bir soat ichida javob beramiz." />

      <section className="container-x grid gap-12 pb-24 lg:grid-cols-12">
        <Reveal className="space-y-8 lg:col-span-5">
          {branches.map((b) => (
            <div key={b.id} className="rounded-(--radius-xl) border border-(--line) p-6">
              <p className="t-eyebrow mb-3 text-orange">{b.name}</p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="mt-0.5 shrink-0 text-(--fg-muted)" />
                  <span>
                    {settings.city}, {b.address}
                  </span>
                </li>
                {b.phone || settings.phone ? (
                  <li className="flex items-start gap-3">
                    <Phone size={18} className="mt-0.5 shrink-0 text-(--fg-muted)" />
                    <ContactLink kind="phone" href={`tel:${(b.phone ?? settings.phone).replace(/\s/g, "")}`} className="font-semibold hover:text-orange">
                      {b.phone ?? settings.phone}
                    </ContactLink>
                  </li>
                ) : null}
                <li className="flex items-start gap-3">
                  <Clock size={18} className="mt-0.5 shrink-0 text-(--fg-muted)" />
                  <span>{b.workingHours ?? settings.workingHours}</span>
                </li>
              </ul>
            </div>
          ))}
          <div className="flex flex-wrap gap-3">
            {settings.telegram ? (
              <ContactLink kind="telegram" href={settings.telegram} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-semibold text-white hover:bg-orange">
                <Send size={16} /> Telegram
              </ContactLink>
            ) : null}
            {settings.instagram ? (
              <ContactLink kind="instagram" href={settings.instagram} className="inline-flex items-center gap-2 rounded-full border border-(--line) px-5 py-3 font-semibold hover:border-orange hover:text-orange">
                Instagram
              </ContactLink>
            ) : null}
          </div>
          {mapUrl ? (
            <div className="overflow-hidden rounded-(--radius-xl) border border-(--line)">
              <iframe src={mapUrl} title="EduTech xaritada" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="aspect-[4/3] w-full" allowFullScreen />
            </div>
          ) : (
            <div className="placeholder-surface grain flex aspect-[4/3] items-center justify-center rounded-(--radius-xl)" role="img" aria-label="Xarita joyi">
              <span className="t-meta rounded-full bg-black/10 px-3 py-1.5">Xarita: admin → Sozlamalar</span>
            </div>
          )}
        </Reveal>

        <Reveal className="glass rounded-(--radius-xl) p-6 sm:p-8 lg:col-span-7" delay={0.15}>
          <p className="t-eyebrow mb-2 text-orange">Xabar yuborish</p>
          <h2 className="t-h3 mb-6">Sizga qanday yordam bera olamiz?</h2>
          <LeadForm type="GENERAL" source="contact" submitLabel="Yuborish" />
        </Reveal>
      </section>
    </>
  );
}
