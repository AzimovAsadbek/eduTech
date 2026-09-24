import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight, Check } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { PortfolioPreview } from "@/components/site/home/portfolio-preview";
import { JsonLd, breadcrumbJsonLd, serviceJsonLd } from "@/components/site/json-ld";
import { MediaInquiry } from "@/components/site/media/media-inquiry";
import { ServiceView } from "@/components/site/media/service-view";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { routes } from "@/config/site";
import { getPublishedServices, getServiceBySlug } from "@/server/modules/content/public";
import { getAuth } from "@/server/modules/auth/service";
import { getSiteSettings } from "@/server/modules/settings/service";

type Params = Promise<{ slug: string }>;
type Step = { step: string; title: string; description: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const s = await getServiceBySlug(slug);
  if (!s) return { title: "Xizmat topilmadi" };
  return {
    title: s.seoTitle ?? `${s.title} — EduTech Media`,
    description: s.seoDescription ?? `${s.tagline} ${s.description.slice(0, 140)}`,
    alternates: { canonical: `/media/xizmatlar/${s.slug}` },
    openGraph: { title: s.seoTitle ?? `${s.title} — EduTech Media`, description: s.seoDescription ?? s.tagline, url: `/media/xizmatlar/${s.slug}`, images: s.coverImage ? [{ url: s.coverImage, alt: s.title }] : undefined },
  };
}

export default async function ServicePage({ params, searchParams }: { params: Params; searchParams: Promise<{ preview?: string }> }) {
  const { slug } = await params;
  const { preview } = await searchParams;
  const isPreview = preview === "1" && Boolean(await getAuth());
  const [service, all, settings] = await Promise.all([getServiceBySlug(slug, { preview: isPreview }), getPublishedServices(), getSiteSettings()]);
  if (!service) notFound();
  const process = (service.process as Step[] | null) ?? [];
  const others = all.filter((s) => s.id !== service.id).slice(0, 4);

  return (
    <div data-world="media" className="bg-(--surface) text-white">
      <ServiceView slug={service.slug} />
      <JsonLd data={serviceJsonLd(service)} />
      <JsonLd data={breadcrumbJsonLd([{ name: "Bosh sahifa", path: "/" }, { name: "Media", path: "/media" }, { name: service.title, path: `/media/xizmatlar/${service.slug}` }])} />

      <section className="relative overflow-hidden pt-36 pb-16 lg:pt-44">
        <div aria-hidden className="pointer-events-none absolute -top-32 right-[-10%] h-[60vh] w-[60vw] rounded-full bg-[radial-gradient(closest-side,rgba(254,126,3,.3),transparent)] blur-3xl" />
        <div className="container-x grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Eyebrow className="mb-5 text-white/60">EduTech Media · xizmat</Eyebrow>
            <SplitHeading as="h1" text={service.title} className="t-display" scroll={false} />
            <Reveal delay={0.3}>
              <p className="t-h3 mt-6 font-normal text-orange">{service.tagline}</p>
              <p className="t-lead mt-5 max-w-xl text-white/70">{service.description}</p>
              <ul className="mt-8 flex flex-wrap gap-2">
                {service.attributes.map((a) => (
                  <li key={a} className="t-meta rounded-full border border-white/15 px-3 py-1.5 text-white/80">
                    {a}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
          <Reveal className="lg:col-span-5" delay={0.2}>
            <PlaceholderImage src={service.coverImage} alt={service.title} label="Xizmat foto / video" className="aspect-[4/5] rounded-(--radius-xl)" priority />
          </Reveal>
        </div>
      </section>

      {service.deliverables.length ? (
        <section className="section-y border-t border-white/10" aria-labelledby="deliverables-title">
          <div className="container-x grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Eyebrow className="mb-3 text-white/60">Nima kiradi</Eyebrow>
              <h2 id="deliverables-title" className="t-h2">
                Siz oladigan natija
              </h2>
            </div>
            <Reveal stagger={0.06} as="ul" className="grid gap-3 sm:grid-cols-2 lg:col-span-8">
              {service.deliverables.map((d) => (
                <li key={d} className="flex items-start gap-3 rounded-(--radius-lg) border border-white/10 bg-white/[0.03] p-5">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-orange text-white">
                    <Check size={14} />
                  </span>
                  <span className="font-medium">{d}</span>
                </li>
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}

      {process.length ? (
        <section className="section-y border-t border-white/10" aria-labelledby="process-title">
          <div className="container-x">
            <Eyebrow className="mb-3 text-white/60">Jarayon</Eyebrow>
            <h2 id="process-title" className="t-h2 max-w-xl">
              Qanday ishlaymiz
            </h2>
            <Reveal stagger={0.08} as="ol" className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {process.map((p) => (
                <li key={p.step} className="border-t border-white/15 pt-5">
                  <p className="font-display text-3xl font-bold text-orange">{p.step}</p>
                  <h3 className="t-h4 mt-4">{p.title}</h3>
                  <p className="mt-2 text-white/60">{p.description}</p>
                </li>
              ))}
            </Reveal>
          </div>
        </section>
      ) : null}

      <PortfolioPreview projects={service.projects.map((p) => ({ ...p, service: { title: service.title, slug: service.slug } }))} limit={3} />

      <MediaInquiry services={all.map((s) => ({ value: s.slug, label: s.title }))} settings={settings} defaultServiceSlug={service.slug} />

      {others.length ? (
        <section className="border-t border-white/10 py-16">
          <div className="container-x">
            <p className="t-eyebrow mb-6 text-white/60">Boshqa xizmatlar</p>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((s) => (
                <li key={s.id}>
                  <Link href={routes.service(s.slug)} className="group flex items-center justify-between rounded-(--radius-lg) border border-white/10 p-5 transition-colors hover:border-orange">
                    <span className="font-semibold">{s.title}</span>
                    <ArrowUpRight size={18} className="text-white/50 transition-transform group-hover:rotate-45 group-hover:text-orange" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
