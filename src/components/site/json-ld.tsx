import { absoluteUrl, siteConfig } from "@/config/site";
import type { SiteSettings } from "@/server/modules/settings/service";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function organizationJsonLd(s: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": absoluteUrl("/#website"),
        url: absoluteUrl("/"),
        name: siteConfig.name,
        description: siteConfig.description,
        inLanguage: "uz",
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

const DAYS: Record<string, string> = { Du: "Monday", Se: "Tuesday", Ch: "Wednesday", Pa: "Thursday", Ju: "Friday", Sh: "Saturday", Ya: "Sunday" };

/** Parses "Du–Sh 09:00–19:00" style strings into schema.org opening hours; falls back to the raw string. */
function openingHours(raw: string) {
  const m = /^(\w\w)[–-](\w\w)\s+(\d\d:\d\d)[–-](\d\d:\d\d)$/.exec(raw.trim());
  if (!m || !DAYS[m[1]] || !DAYS[m[2]]) return undefined;
  const order = Object.keys(DAYS);
  const from = order.indexOf(m[1]);
  const to = order.indexOf(m[2]);
  const days = order.slice(from, to + 1).map((d) => DAYS[d]);
  return [{ "@type": "OpeningHoursSpecification", dayOfWeek: days, opens: m[3], closes: m[4] }];
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };
}

export function courseListJsonLd(courses: { title: string; slug: string; tagline: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "EduTech kurslari",
    itemListElement: courses.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(`/kurslar/${c.slug}`),
      name: c.title,
      description: c.tagline,
    })),
  };
}

export function serviceListJsonLd(services: { title: string; slug: string; tagline: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "EduTech Media xizmatlari",
    itemListElement: services.map((s, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(`/media/xizmatlar/${s.slug}`), name: s.title, description: s.tagline })),
  };
}

export function courseJsonLd(c: { title: string; description: string; slug: string; durationLabel: string; format: string; coverImage?: string | null; skills?: string[]; roleLabel?: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.title,
    description: c.description,
    url: absoluteUrl(`/kurslar/${c.slug}`),
    image: c.coverImage ? absoluteUrl(c.coverImage) : absoluteUrl("/opengraph-image"),
    inLanguage: "uz",
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

export function serviceJsonLd(s: { title: string; description: string; slug: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.title,
    description: s.description,
    url: absoluteUrl(`/media/xizmatlar/${s.slug}`),
    provider: { "@type": "LocalBusiness", "@id": absoluteUrl("/#organization"), name: `${siteConfig.name} Media`, url: absoluteUrl("/media") },
    serviceType: s.title,
    areaServed: { "@type": "City", name: siteConfig.city },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}
