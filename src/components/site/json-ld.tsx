import { absoluteUrl, siteConfig } from "@/config/site";
import type { SiteSettings } from "@/server/modules/settings/service";

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function organizationJsonLd(s: SiteSettings) {
  return {
    "@context": "https://schema.org",
    "@type": ["EducationalOrganization", "LocalBusiness"],
    name: siteConfig.name,
    description: siteConfig.description,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon.svg"),
    telephone: s.phone || undefined,
    email: s.email || undefined,
    address: { "@type": "PostalAddress", addressLocality: s.city, streetAddress: s.address || undefined, addressCountry: "UZ" },
    openingHours: s.workingHours,
    sameAs: [s.instagram, s.telegram, s.youtube].filter(Boolean),
  };
}

export function courseJsonLd(c: { title: string; description: string; slug: string; durationLabel: string; format: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: c.title,
    description: c.description,
    url: absoluteUrl(`/kurslar/${c.slug}`),
    provider: { "@type": "EducationalOrganization", name: siteConfig.name, url: absoluteUrl("/") },
    hasCourseInstance: { "@type": "CourseInstance", courseMode: c.format === "ONLINE" ? "online" : c.format === "HYBRID" ? "blended" : "onsite", location: siteConfig.city },
  };
}

export function serviceJsonLd(s: { title: string; description: string; slug: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: s.title,
    description: s.description,
    url: absoluteUrl(`/media/xizmatlar/${s.slug}`),
    provider: { "@type": "LocalBusiness", name: `${siteConfig.name} Media`, url: absoluteUrl("/media") },
    areaServed: siteConfig.city,
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: absoluteUrl(it.path) })),
  };
}
