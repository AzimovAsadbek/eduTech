import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
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
  return (
    <footer className="relative overflow-hidden bg-ink text-white" data-world="media">
      <div className="orange-glow absolute -top-1/2 left-1/2 h-[80vh] w-[80vw] -translate-x-1/2 opacity-40" aria-hidden />
      <div className="container-x relative pt-20 pb-10">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Logo className="text-white" />
            <p className="mt-6 max-w-sm text-white/60">{settings.tagline}. IT + AI + Digital + Creative — {settings.city}dagi zamonaviy kasblar akademiyasi va media studiya.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {settings.telegram ? (
                <ContactLink kind="telegram" href={settings.telegram} className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-orange hover:text-orange">
                  Telegram
                </ContactLink>
              ) : null}
              {settings.instagram ? (
                <ContactLink kind="instagram" href={settings.instagram} className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-orange hover:text-orange">
                  Instagram
                </ContactLink>
              ) : null}
              {settings.youtube ? (
                <a href={settings.youtube} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/15 px-4 py-2 text-sm hover:border-orange hover:text-orange">
                  YouTube
                </a>
              ) : null}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            <div>
              <p className="t-eyebrow mb-4 text-white/50">Sayt</p>
              <ul className="space-y-2.5">
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
              <p className="t-eyebrow mb-4 text-white/50">Yoʻnalishlar</p>
              <ul className="space-y-2.5">
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
              <p className="t-eyebrow mb-4 text-white/50">Kontakt</p>
              <ul className="space-y-2.5 text-white/80">
                <li>{settings.city}{settings.address ? `, ${settings.address}` : ""}</li>
                {settings.phone ? (
                  <li>
                    <ContactLink kind="phone" href={`tel:${settings.phone.replace(/\s/g, "")}`} className="hover:text-orange">
                      {settings.phone}
                    </ContactLink>
                  </li>
                ) : null}
                {settings.email ? (
                  <li>
                    <a href={`mailto:${settings.email}`} className="hover:text-orange">
                      {settings.email}
                    </a>
                  </li>
                ) : null}
                <li className="text-white/50">{settings.workingHours}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-20 select-none overflow-hidden" aria-hidden>
          <p className="font-display text-[clamp(4rem,18vw,16rem)] leading-[0.85] font-bold tracking-[-0.06em] text-white/[0.06]">EduTech</p>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {siteConfig.name}. Barcha huquqlar himoyalangan.
          </p>
          <Link href="/admin" className="inline-flex items-center gap-1 hover:text-white">
            Admin <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
