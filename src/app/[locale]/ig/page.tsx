import type { Metadata } from "next";
import { headers } from "next/headers";
import { ArrowRight, ArrowUpRight, MapPin, Phone, Send } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Logo } from "@/components/brand/logo";
import { InstagramGlyph } from "@/components/brand/social-icons";
import { Counter } from "@/components/motion/counter";
import { AttributionTracker } from "@/components/site/attribution-tracker";
import { ContactLink } from "@/components/site/contact-link";
import { LanguageSwitcher } from "@/components/site/language-switcher";
import { LeadForm } from "@/components/site/lead-form";
import { MetaPixel } from "@/components/site/meta-pixel";
import { routes } from "@/config/site";
import { localizeAll } from "@/i18n/localize";
import { localizeCourses } from "@/i18n/localize-content";
import { localizeSettings } from "@/i18n/localize-settings";
import { Link } from "@/i18n/navigation";
import { resolveLocale, type LocaleParams } from "@/i18n/params";
import { pageMetadata } from "@/lib/seo";
import { pad2 } from "@/lib/utils";
import { getActiveBranches, getPublishedCourses } from "@/server/modules/content/public";
import { getSiteSettings } from "@/server/modules/settings/service";

// Per request: the Meta Pixel needs the CSP nonce, and the page is a campaign landing (never cached stale).
export const dynamic = "force-dynamic";

type Props = { params: LocaleParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "growth.ig" });
  // Campaign landing for the Instagram bio link: kept out of search results.
  return pageMetadata({ title: t("metaTitle"), description: t("metaDescription"), path: "/ig", locale, noindex: true });
}

/**
 * Link-in-bio landing for Instagram. Everything an Instagram visitor needs on one screen:
 * a 30-second consultation form, the course list and direct contacts. Untagged visits are
 * attributed to Instagram (bio) automatically.
 */
export default async function InstagramLanding({ params }: Props) {
  const locale = await resolveLocale(params);
  setRequestLocale(locale);
  const [t, tc, rawSettings, rawCourses, rawBranches] = await Promise.all([
    getTranslations("growth.ig"),
    getTranslations("common"),
    getSiteSettings(),
    getPublishedCourses(),
    getActiveBranches(),
  ]);
  const settings = localizeSettings(rawSettings, locale);
  const courses = localizeCourses(rawCourses, locale);
  const branches = localizeAll(rawBranches, locale);
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  const contacts = { phone: settings.phone || undefined, telegram: settings.telegram || undefined };
  const mapUrl =
    branches.find((b) => b.mapUrl)?.mapUrl ||
    (settings.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.city}, ${settings.address}`)}` : "");
  const actions = [
    contacts.telegram ? { key: "telegram", href: contacts.telegram, label: t("telegram"), icon: <Send size={18} />, kind: "telegram" as const, className: "bg-[#229ED9] text-white" } : null,
    contacts.phone ? { key: "call", href: `tel:${contacts.phone.replace(/\s/g, "")}`, label: t("call"), icon: <Phone size={18} />, kind: "phone" as const, className: "bg-ink text-white" } : null,
    settings.instagram
      ? {
          key: "instagram",
          href: settings.instagram,
          label: t("instagram"),
          icon: <InstagramGlyph size={18} />,
          kind: "instagram" as const,
          className: "bg-[linear-gradient(135deg,#fa7e1e_0%,#d62976_55%,#962fbf_100%)] text-white",
        }
      : null,
  ].filter(Boolean) as { key: string; href: string; label: string; icon: React.ReactNode; kind: "telegram" | "phone" | "instagram"; className: string }[];

  return (
    <main className="relative min-h-dvh overflow-hidden bg-paper text-ink">
      <div aria-hidden className="pointer-events-none absolute -top-40 -right-32 size-[34rem] rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.28),transparent)] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute top-[38rem] -left-40 size-[28rem] rounded-full bg-[radial-gradient(closest-side,rgba(255,178,122,.3),transparent)] blur-3xl" />

      <div className="relative mx-auto max-w-[34rem] px-4 pt-5 pb-16 sm:pt-8">
        <header className="flex items-center justify-between">
          <Logo height={34} tagline href={locale === "uz" ? "/" : `/${locale}`} label={tc("a11y.home")} />
          <LanguageSwitcher />
        </header>

        <section className="mt-9">
          <p className="t-eyebrow text-(--fg-muted)">{t("eyebrow")}</p>
          <h1 className="t-h1 mt-3 text-[2.15rem] sm:text-[2.6rem]">{t("title")}</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-(--fg-muted)">{t("lead")}</p>
          <dl className="mt-6 grid grid-cols-3 gap-2">
            {[
              { v: settings.stats.students, l: tc("stats.students") },
              { v: settings.stats.courses, l: tc("stats.courses") },
              { v: settings.stats.projects, l: tc("stats.projects") },
            ].map((s) => (
              <div key={s.l} className="glass rounded-[18px] px-3 py-2.5">
                <dd className="font-display text-xl font-bold tracking-tight">
                  <Counter value={s.v} />
                </dd>
                <dt className="t-meta text-[10px] text-(--fg-muted)">{s.l}</dt>
              </div>
            ))}
          </dl>
        </section>

        <section id="ariza" aria-labelledby="ig-form-title" className="glass mt-6 scroll-mt-4 rounded-[28px] p-5 sm:p-6">
          <p className="t-eyebrow text-orange">{t("formTitle")}</p>
          <h2 id="ig-form-title" className="t-h3 mt-1.5">
            {t("formLead")}
          </h2>
          <LeadForm
            type="EDUCATION"
            variant="quick"
            courses={courses.map((c) => ({ value: c.slug, label: c.title }))}
            branches={branches.map((b) => ({ value: b.id, label: b.name }))}
            source="ig:bio"
            contacts={contacts}
            submitLabel={t("submit")}
            className="mt-5"
          />
        </section>

        {actions.length ? (
          <section aria-label={t("contactTitle")} className="mt-4 grid grid-cols-3 gap-2">
            {actions.map((a) => (
              <ContactLink
                key={a.key}
                kind={a.kind}
                href={a.href}
                className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-[18px] text-[12px] font-semibold shadow-sm transition-transform active:scale-[0.97] ${a.className}`}
              >
                {a.icon}
                {a.label}
              </ContactLink>
            ))}
          </section>
        ) : null}

        <section aria-labelledby="ig-courses-title" className="mt-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 id="ig-courses-title" className="t-h3">
                {t("coursesTitle")}
              </h2>
              <p className="mt-1 text-sm text-(--fg-muted)">{t("coursesLead")}</p>
            </div>
          </div>
          <ul className="mt-4 space-y-2">
            {courses.map((c, i) => (
              <li key={c.id}>
                <Link
                  href={routes.course(c.slug)}
                  className="group flex items-center gap-3 rounded-[20px] border border-(--line) bg-paper/80 p-2.5 pr-4 backdrop-blur transition-[border-color,transform] duration-300 hover:border-orange/40 active:scale-[0.99]"
                >
                  <span
                    className="font-display grid size-12 shrink-0 place-items-center rounded-[14px] text-base font-bold text-white"
                    style={{ background: `linear-gradient(150deg, ${c.accent ?? "#FF6B1A"}, #E5560A)` }}
                    aria-hidden
                  >
                    {pad2(i + 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{c.title}</span>
                    <span className="block truncate text-sm text-(--fg-muted)">
                      {c.roleLabel} · {c.durationLabel}
                    </span>
                  </span>
                  <ArrowRight size={18} className="shrink-0 text-(--fg-muted) transition-transform group-hover:translate-x-0.5 group-hover:text-orange" />
                </Link>
              </li>
            ))}
          </ul>
          <Link href={routes.courses} className="mt-4 inline-flex items-center gap-1 font-semibold text-orange">
            {t("allCourses")} <ArrowUpRight size={16} />
          </Link>
        </section>

        {mapUrl || settings.address ? (
          <section className="mt-10 flex items-start gap-3 rounded-[20px] border border-(--line) p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-orange-soft text-orange">
              <MapPin size={18} />
            </span>
            <div className="min-w-0 text-sm">
              <p className="font-semibold">{t("map")}</p>
              <p className="text-(--fg-muted)">
                {settings.city}
                {settings.address ? `, ${settings.address}` : ""} · {settings.workingHours}
              </p>
              {mapUrl ? (
                <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-orange">
                  Google Maps <ArrowUpRight size={14} />
                </a>
              ) : null}
            </div>
          </section>
        ) : null}

        <footer className="mt-10 flex items-center justify-between border-t border-(--line) pt-5 text-sm">
          <Link href="/" className="inline-flex items-center gap-1 font-semibold">
            {t("site")} <ArrowUpRight size={15} />
          </Link>
          <span className="t-meta text-(--fg-muted)">© {new Date().getFullYear()} EduTech</span>
        </footer>
      </div>

      <AttributionTracker defaults={{ utmSource: "instagram", utmMedium: "bio" }} />
      {pixelId ? <MetaPixel pixelId={pixelId} nonce={nonce} /> : null}
    </main>
  );
}
