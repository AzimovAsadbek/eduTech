import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Service } from "@prisma/client";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading } from "@/components/ui/section-heading";
import { routes } from "@/config/site";
import { Link } from "@/i18n/navigation";
import { pad2 } from "@/lib/utils";

/** Homepage teaser for the MEDIA world: four featured services as glass cards, the full explorer lives on /media. */
export async function ServicesTeaser({ services }: { services: Service[] }) {
  const t = await getTranslations("servicesTeaser");
  const tc = await getTranslations("common");
  const picks = [...services].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 4);
  if (!picks.length) return null;
  return (
    <section data-world="media" data-nav="/media" className="section-y bg-(--surface) text-white" aria-labelledby="services-teaser-title">
      <div className="container-x">
        <SectionHeading
          eyebrow={t("eyebrow")}
          title={<span id="services-teaser-title">{t("title")}</span>}
          lead={t("lead")}
          align="split"
          aside={
            <Link href={routes.media} className="mt-4 inline-flex items-center gap-1 font-semibold text-orange hover:underline">
              {t("cta")} <ArrowUpRight size={16} />
            </Link>
          }
        />
        <Reveal stagger={0.08} as="ul" className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {picks.map((s, i) => (
            <li key={s.id}>
              <Link href={routes.service(s.slug)} className="glass group flex h-full flex-col rounded-(--radius-xl) p-6 transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:[--glass-border:rgba(255,107,26,.6)] active:scale-[0.98]">
                <div className="flex items-center justify-between">
                  <span className="t-meta text-white/50">{pad2(i + 1)}</span>
                  <span className="grid size-9 place-items-center rounded-full border border-white/15 transition-[background-color,transform] duration-300 group-hover:rotate-45 group-hover:bg-orange">
                    <ArrowUpRight size={16} />
                  </span>
                </div>
                <h3 className="t-h3 mt-8">{s.title}</h3>
                <p className="mt-2 flex-1 text-white/65">{s.tagline}</p>
                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {s.attributes.slice(0, 3).map((a) => (
                    <li key={a} className="t-meta rounded-full border border-white/15 px-2.5 py-1 text-white/75">
                      {a}
                    </li>
                  ))}
                </ul>
              </Link>
            </li>
          ))}
        </Reveal>
        <p className="t-meta mt-8 text-white/45">{t("count", { count: services.length })} · {tc("nav.media")}</p>
      </div>
    </section>
  );
}
