import Link from "next/link";
import { nav, siteConfig } from "@/config/site";
import type { SiteSettings } from "@/server/modules/settings/service";
import { Logo } from "./logo";
import { ContactLink } from "./contact-link";

const mediaLinks = [
  { href: "/media", label: "Media xizmatlar" },
  { href: "/media/portfolio", label: "Portfolio" },
  { href: "/kurslar", label: "Barcha kurslar" },
];

export function Footer({ settings }: { settings: SiteSettings }) {
  const year = new Date().getFullYear();
  const socials = [
    settings.telegram ? { kind: "telegram" as const, href: settings.telegram, label: "Telegram" } : null,
    settings.instagram ? { kind: "instagram" as const, href: settings.instagram, label: "Instagram" } : null,
  ].filter(Boolean) as { kind: "telegram" | "instagram"; href: string; label: string }[];

  return (
    <footer className="relative overflow-hidden bg-ink text-white" data-world="media">
      <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] h-80 w-[50vw] rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.22),transparent)] blur-3xl" />
      <div className="container-x relative pt-14 pb-8">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo className="text-white" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/60">
              {settings.tagline}. IT + AI + Digital + Creative — {settings.city}dagi zamonaviy kasblar akademiyasi va media studiya.
            </p>
            {socials.length || settings.youtube ? (
              <div className="mt-5 flex flex-wrap gap-2">
                {socials.map((s) => (
                  <ContactLink key={s.kind} kind={s.kind} href={s.href} className="rounded-full border border-white/15 px-3.5 py-1.5 text-sm transition-colors hover:border-orange hover:text-orange">
                    {s.label}
                  </ContactLink>
                ))}
                {settings.youtube ? (
                  <a href={settings.youtube} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-3.5 py-1.5 text-sm transition-colors hover:border-orange hover:text-orange">
                    YouTube
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            <div>
              <p className="t-eyebrow mb-3 text-white/45">Sayt</p>
              <ul className="space-y-2 text-sm">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-white/80 transition-colors hover:text-orange">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="t-eyebrow mb-3 text-white/45">Yoʻnalishlar</p>
              <ul className="space-y-2 text-sm">
                {mediaLinks.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-white/80 transition-colors hover:text-orange">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="t-eyebrow mb-3 text-white/45">Kontakt</p>
              <ul className="space-y-2 text-sm text-white/80">
                <li>
                  {settings.city}
                  {settings.address ? `, ${settings.address}` : ""}
                </li>
                {settings.phone ? (
                  <li>
                    <ContactLink kind="phone" href={`tel:${settings.phone.replace(/\s/g, "")}`} className="transition-colors hover:text-orange">
                      {settings.phone}
                    </ContactLink>
                  </li>
                ) : null}
                {settings.email ? (
                  <li>
                    <a href={`mailto:${settings.email}`} className="transition-colors hover:text-orange">
                      {settings.email}
                    </a>
                  </li>
                ) : null}
                <li className="text-white/50">{settings.workingHours}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/10 pt-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. Barcha huquqlar himoyalangan.
          </p>
          <p className="font-display text-sm font-semibold tracking-tight text-white/60">
            Edu<span className="text-orange">Tech</span> · {settings.city}
          </p>
        </div>
      </div>
    </footer>
  );
}
