import type { Metadata } from "next";
import { Reveal } from "@/components/motion/reveal";
import { FaqSection } from "@/components/site/faq-section";
import { MediaHero } from "@/components/site/home/media-hero";
import { PortfolioPreview } from "@/components/site/home/portfolio-preview";
import { ServiceExplorer } from "@/components/site/home/service-explorer";
import { JsonLd, breadcrumbJsonLd, serviceListJsonLd } from "@/components/site/json-ld";
import { MediaInquiry } from "@/components/site/media/media-inquiry";
import { SectionHeading } from "@/components/ui/section-heading";
import { getPublishedFaqs, getPublishedProjects, getPublishedServices } from "@/server/modules/content/public";
import { getSiteSettings } from "@/server/modules/settings/service";

export const metadata: Metadata = {
  title: "Media xizmatlar — Reels, YouTube, SMM, Target, Video Production",
  description: "EduTech Media: Namangandagi bizneslar uchun Reels va YouTube prodakshn, SMM, target reklama, video ishlab chiqarish, personal branding va Instagram boshqaruvi.",
  alternates: { canonical: "/media" },
};

const process = [
  { n: "01", t: "Brif va tahlil", d: "Maqsad, auditoriya, raqobatchilar. Nimani va kim uchun yaratayotganimizni aniqlaymiz." },
  { n: "02", t: "Strategiya", d: "Kontent ustunlari, formatlar, kanal va nashr ritmi — bitta hujjatda." },
  { n: "03", t: "Prodakshn", d: "Ssenariy, sʼyomka, montaj. Studiya yoki lokatsiya — jamoa bilan." },
  { n: "04", t: "Nashr va oʻsish", d: "Nashr, target, tahlil, optimizatsiya. Har oy hisobot va keyingi qadam." },
];

export default async function MediaPage() {
  const [services, projects, faqs, settings] = await Promise.all([getPublishedServices(), getPublishedProjects(), getPublishedFaqs(), getSiteSettings()]);
  return (
    <div data-world="media" className="bg-(--surface) text-white">
      <JsonLd data={breadcrumbJsonLd([{ name: "Bosh sahifa", path: "/" }, { name: "Media", path: "/media" }])} />
      <JsonLd data={serviceListJsonLd(services)} />
      <MediaHero standalone />
      <ServiceExplorer services={services} />

      <section className="section-y border-t border-white/10" aria-labelledby="process-title">
        <div className="container-x">
          <SectionHeading eyebrow="Jarayon" title={<span id="process-title">Gʻoyadan natijagacha — toʻrt qadam.</span>} lead="Har bir loyiha bir xil intizom bilan boshqariladi: aniq brif, oʻlchanadigan maqsad, hisobot." align="split" />
          <Reveal stagger={0.08} as="ol" className="mt-14 grid gap-px overflow-hidden rounded-(--radius-xl) border border-white/10 bg-white/10 md:grid-cols-2 lg:grid-cols-4">
            {process.map((p) => (
              <li key={p.n} className="bg-(--surface) p-8">
                <p className="font-display text-4xl font-bold text-orange">{p.n}</p>
                <h3 className="t-h4 mt-6">{p.t}</h3>
                <p className="mt-2 text-white/60">{p.d}</p>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      <PortfolioPreview projects={projects} />
      <FaqSection faqs={faqs.filter((f) => f.scope !== "EDU")} title="Media xizmatlar haqida savollar" />
      <MediaInquiry services={services.map((s) => ({ value: s.slug, label: s.title }))} settings={settings} />
    </div>
  );
}
