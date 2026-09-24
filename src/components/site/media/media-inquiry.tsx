import { getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/ui/eyebrow";
import { LeadForm, type LeadFormOption } from "@/components/site/lead-form";
import { ContactLink } from "@/components/site/contact-link";
import type { SiteSettings } from "@/server/modules/settings/service";

/** Media conversion block on the dark world: glass card, one form, pre-bound service optional. */
export async function MediaInquiry({ services, settings, defaultServiceSlug }: { services: LeadFormOption[]; settings: SiteSettings; defaultServiceSlug?: string }) {
  const t = await getTranslations("mediaInquiry");
  return (
    <section id="media-inquiry" data-world="media" className="section-y relative scroll-mt-20 overflow-hidden bg-(--surface) text-white" aria-labelledby="inquiry-title">
      <div aria-hidden className="pointer-events-none absolute -bottom-1/2 left-1/2 size-[80vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.3),transparent)] blur-3xl" />
      <div className="container-x relative grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow className="mb-4 text-white/60">{t("eyebrow")}</Eyebrow>
          <h2 id="inquiry-title" className="t-h1">
            {t("title")} <span className="text-orange">{t("titleAccent")}</span>
          </h2>
          <p className="t-lead mt-5 max-w-md text-white/70">{t("lead")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {settings.telegram ? (
              <ContactLink kind="telegram" href={settings.telegram} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:border-orange hover:text-orange">
                {t("telegram")}
              </ContactLink>
            ) : null}
            {settings.phone ? (
              <ContactLink kind="phone" href={`tel:${settings.phone.replace(/\s/g, "")}`} className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold hover:border-orange hover:text-orange">
                {settings.phone}
              </ContactLink>
            ) : null}
          </div>
        </div>
        <div className="glass rounded-(--radius-xl) p-6 sm:p-8 lg:col-span-7">
          <LeadForm type="MEDIA" services={services} defaultServiceSlug={defaultServiceSlug} source={defaultServiceSlug ? `service:${defaultServiceSlug}` : "media:inquiry"} submitLabel={t("submit")} dark />
        </div>
      </div>
    </section>
  );
}
