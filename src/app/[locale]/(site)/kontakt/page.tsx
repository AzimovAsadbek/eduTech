import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, MapPin, Phone, Send } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { ContactLink } from "@/components/site/contact-link";
import { JsonLd, breadcrumbJsonLd, webPageJsonLd } from "@/components/site/json-ld";
import { LeadForm } from "@/components/site/lead-form";
import { PageHeader } from "@/components/site/page-header";
import { localizeAll } from "@/i18n/localize";
import { localizeSettings } from "@/i18n/localize-settings";
import { resolveLocale, type LocaleParams } from "@/i18n/params";
import { getActiveBranches } from "@/server/modules/content/public";
import { getSiteSettings } from "@/server/modules/settings/service";
import { pageMetadata } from "@/lib/seo";

type Props = { params: LocaleParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pages.contact" });
  return pageMetadata({ title: t("seo.title"), description: t("seo.description"), path: "/kontakt", locale });
}

export default async function ContactPage({ params }: Props) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const [t, tc, tl, rawSettings, rawBranches] = await Promise.all([getTranslations("pages.contact"), getTranslations("common"), getTranslations("pages.jsonLd"), getSiteSettings(), getActiveBranches()]);
  const settings = localizeSettings(rawSettings, locale);
  const branches = localizeAll(rawBranches, locale);
  const mapUrl = settings.mapEmbedUrl || branches.find((b) => b.mapUrl)?.mapUrl || "";
  return (
    <>
      <JsonLd data={webPageJsonLd("ContactPage", tl("contact"), "/kontakt", locale)} />
      <JsonLd data={breadcrumbJsonLd([{ name: tc("nav.home"), path: "/" }, { name: tc("nav.contact"), path: "/kontakt" }], locale)} />
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} accent={t.raw("accent") as string[]} lead={t("lead")} />

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
              <iframe src={mapUrl} title={t("mapTitle")} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="aspect-[4/3] w-full" allowFullScreen />
            </div>
          ) : (
            <div className="placeholder-surface grain flex aspect-[4/3] items-center justify-center rounded-(--radius-xl)" role="img" aria-label={t("mapPlaceholder")}>
              <span className="t-meta rounded-full bg-black/10 px-3 py-1.5">{t("mapHint")}</span>
            </div>
          )}
        </Reveal>

        <Reveal className="glass rounded-(--radius-xl) p-6 sm:p-8 lg:col-span-7" delay={0.15}>
          <p className="t-eyebrow mb-2 text-orange">{t("form.eyebrow")}</p>
          <h2 className="t-h3 mb-6">{t("form.title")}</h2>
          <LeadForm type="GENERAL" source="contact" submitLabel={tc("actions.send")} />
        </Reveal>
      </section>
    </>
  );
}
