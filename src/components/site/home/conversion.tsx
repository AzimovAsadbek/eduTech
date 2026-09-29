import { getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/ui/eyebrow";
import { LeadForm, type LeadFormOption } from "@/components/site/lead-form";
import { ContactLink } from "@/components/site/contact-link";
import type { SiteSettings } from "@/server/modules/settings/service";

interface Props {
  courses: LeadFormOption[];
  branches: LeadFormOption[];
  settings: SiteSettings;
}

/** CONVERSION: the course application. Glass card with one form on a warm ambient wash + contact facts. */
export async function Conversion({ courses, branches, settings }: Props) {
  const [t, tc] = await Promise.all([getTranslations("conversion"), getTranslations("common.actions")]);
  return (
    <section id="ariza" className="section-y relative overflow-hidden bg-orange-soft" aria-labelledby="apply-title" data-nav="/kontakt">
      <div aria-hidden className="pointer-events-none absolute -top-1/3 -right-1/4 size-[70vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.35),transparent)] blur-3xl" />
      <div className="container-x relative grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow className="mb-4">{t("eyebrow")}</Eyebrow>
          <h2 id="apply-title" className="t-h1">
            {t("title")} <span className="text-orange">{t("titleAccent")}</span>
          </h2>
          <p className="t-lead mt-5 max-w-md">{t("lead")}</p>

          <dl className="mt-10 space-y-5">
            <div>
              <dt className="t-meta text-(--fg-muted)">{t("address")}</dt>
              <dd className="mt-1 font-semibold">{settings.city}{settings.address ? `, ${settings.address}` : ""}</dd>
            </div>
            {settings.phone ? (
              <div>
                <dt className="t-meta text-(--fg-muted)">{t("phone")}</dt>
                <dd className="mt-1 font-semibold">
                  <ContactLink kind="phone" href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-orange">
                    {settings.phone}
                  </ContactLink>
                </dd>
              </div>
            ) : null}
            <div>
              <dt className="t-meta text-(--fg-muted)">{t("hours")}</dt>
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
          <p className="t-eyebrow mb-2 text-orange">{tc("apply")}</p>
          <h3 className="t-h3 mb-6">{t("formTitle")}</h3>
          <LeadForm type="EDUCATION" courses={courses} branches={branches} source="home:apply" submitLabel={t("submitEducation")} />
        </div>
      </div>
    </section>
  );
}
