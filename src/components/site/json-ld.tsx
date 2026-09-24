import { absoluteUrl, siteConfig } from "@/config/site";
import type { Locale } from "@/i18n/routing";
import { localePath } from "@/lib/seo";
import type { SiteSettings } from "@/server/modules/settings/service";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

/** Absolute URL of a locale-free path in the given locale. */
const pageUrl = (path: string, locale: Locale) => absoluteUrl(localePath(path, locale));

export function organizationJsonLd(s: SiteSettings, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        url: pageUrl("/", locale),
        name: siteConfig.name,
        description: siteConfig.description,
        inLanguage: locale,
        publisher: { "@id": absoluteUrl("/#organization") },
      },
      {
        "@type": ["EducationalOrganization", "LocalBusiness"],
        "@id": absoluteUrl("/#organization"),
        name: siteConfig.name,
        alternateName: "Edu Tech Namangan",
        slogan: s.tagline,
        description: siteConfig.description,
        url: absoluteUrl("/"),
        logo: { "@type": "ImageObject", url: absoluteUrl("/brand/logo-light.svg"), width: 373, height: 115 },
        image: absoluteUrl("/opengraph-image"),
        telephone: s.phone || undefined,
        email: s.email || undefined,
        address: { "@type": "PostalAddress", addressLocality: s.city, addressRegion: "Namangan viloyati", streetAddress: s.address || undefined, addressCountry: "UZ" },
        areaServed: { "@type": "City", name: s.city },
        openingHoursSpecification: openingHours(s.workingHours),
        priceRange: "$$",
        sameAs: [s.instagram, s.telegram, s.youtube].filter(Boolean),
        contactPoint: s.phone ? [{ "@type": "ContactPoint", telephone: s.phone, contactType: "customer service", availableLanguage: ["uz", "ru"] }] : undefined,
      },
    ],
  };
}

const DAYS: Record<string, string> = {
  // Uzbek
  Du: "Monday", Se: "Tuesday", Ch: "Wednesday", Pa: "Thursday", Ju: "Friday", Sh: "Saturday", Ya: "Sunday",
  // Russian
  Пн: "Monday", Вт: "Tuesday", Ср: "Wednesday", Чт: "Thursday", Пт: "Friday", Сб: "Saturday", Вс: "Sunday",
  // English
  Mo: "Monday", Tu: "Tuesday", We: "Wednesday", Th: "Thursday", Fr: "Friday", Sa: "Saturday", Su: "Sunday",
};
const WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Parses "Du–Sh 09:00–19:00" / "Пн–Сб 09:00–19:00" / "Mo–Sa 09:00–19:00" strings into schema.org opening hours. */
function openingHours(raw: string) {
  const m = /^(\S\S)[–-](\S\S)\s+(\d\d:\d\d)[–-](\d\d:\d\d)$/.exec(raw.trim());
  if (!m || !DAYS[m[1]] || !DAYS[m[2]]) return undefined;
  const from = WEEK.indexOf(DAYS[m[1]]);
  const to = WEEK.indexOf(DAYS[m[2]]);
  if (from > to) return undefined;
  return [{ "@type": "OpeningHoursSpecification", dayOfWeek: WEEK.slice(from, to + 1), opens: m[3], closes: m[4] }];
}

export function webPageJsonLd(type: "AboutPage" | "ContactPage" | "CollectionPage" | "WebPage", name: string, path: string, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": type,
    name,
    url: pageUrl(path, locale),
    inLanguage: locale,
    isPartOf: { "@id": absoluteUrl("/#website") },
    about: { "@id": absoluteUrl("/#organization") },
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
}

export function courseListJsonLd(courses: { title: string; slug: string; tagline: string }[], locale: Locale, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    inLanguage: locale,
    itemListElement: courses.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: pageUrl(`/kurslar/${c.slug}`, locale),
      name: c.title,
      description: c.tagline,
    })),
  };
}

export function serviceListJsonLd(services: { title: string; slug: string; tagline: string }[], locale: Locale, name: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    inLanguage: locale,
    itemListElement: services.map((s, i) => ({ "@type": "ListItem", position: i + 1, url: pageUrl(`/media/xizmatlar/${s.slug}`, locale), name: s.title, description: s.tagline })),
  };
}

export function courseJsonLd(
  c: { title: string; description: string; slug: string; durationLabel: string; format: string; coverImage?: string | null; skills?: string[]; roleLabel?: string },
  locale: Locale,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.title,
    description: c.description,
    url: pageUrl(`/kurslar/${c.slug}`, locale),
    image: c.coverImage ? absoluteUrl(c.coverImage) : absoluteUrl("/opengraph-image"),
    inLanguage: locale,
    teaches: c.skills?.length ? c.skills : undefined,
    occupationalCategory: c.roleLabel,
    provider: { "@type": "EducationalOrganization", "@id": absoluteUrl("/#organization"), name: siteConfig.name, url: absoluteUrl("/") },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: c.format === "ONLINE" ? "online" : c.format === "HYBRID" ? "blended" : "onsite",
      courseWorkload: c.durationLabel,
      location: { "@type": "Place", name: `${siteConfig.name}, ${siteConfig.city}`, address: { "@type": "PostalAddress", addressLocality: siteConfig.city, addressCountry: "UZ" } },
    },
  };
}

export function serviceJsonLd(s: { title: string; description: string; slug: string }, locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.title,
    description: s.description,
    url: pageUrl(`/media/xizmatlar/${s.slug}`, locale),
    inLanguage: locale,
    provider: { "@type": "LocalBusiness", "@id": absoluteUrl("/#organization"), name: `${siteConfig.name} Media`, url: pageUrl("/media", locale) },
    serviceType: s.title,
    areaServed: { "@type": "City", name: siteConfig.city },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[], locale: Locale) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: pageUrl(it.path, locale) })),
  };
}
