import { Link } from "@/i18n/navigation";
import { ArrowUpRight, Play } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { Reveal } from "@/components/motion/reveal";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { SectionHeading } from "@/components/ui/section-heading";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

export type ProjectCard = Prisma.MediaProjectGetPayload<{ include: { service: { select: { title: true; slug: true } } } }>;

/** Editorial masonry of real projects. Renders nothing until the CMS has published work. */
export function PortfolioPreview({ projects, heading = true, limit = 5 }: { projects: ProjectCard[]; heading?: boolean; limit?: number }) {
  const items = projects.slice(0, limit);
  if (!items.length) return null;
  const spans = ["lg:col-span-7 lg:row-span-2", "lg:col-span-5", "lg:col-span-5", "lg:col-span-4", "lg:col-span-8"];
  return (
    <section data-world="media" data-nav="/media" className="section-y bg-(--surface) text-white" aria-labelledby="portfolio-title">
      <div className="container-x">
        {heading ? (
          <SectionHeading
            eyebrow="Portfolio"
            title={<span id="portfolio-title">Biz yaratgan kontentlar.</span>}
            lead="Har bir loyiha — mijoz muammosi, bizning strategiya va oʻlchanadigan natija."
            align="split"
            aside={
              <Link href={routes.portfolio} className="mt-4 inline-flex items-center gap-1 font-semibold text-orange hover:underline">
                Toʻliq portfolio <ArrowUpRight size={16} />
              </Link>
            }
          />
        ) : null}
        <Reveal stagger={0.08} className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 lg:auto-rows-[18rem]">
          {items.map((p, i) => {
            const hasVideo = Array.isArray(p.videos) && (p.videos as unknown[]).length > 0;
            return (
              <Link key={p.id} href={routes.project(p.slug)} data-cursor="view" className={cn("group relative overflow-hidden rounded-(--radius-lg) bg-ink-2", spans[i] ?? "lg:col-span-4", i === 0 ? "aspect-[4/3] lg:aspect-auto" : "aspect-[4/3] lg:aspect-auto")}>
                <PlaceholderImage src={p.coverImage} alt={p.title} className="absolute inset-0 transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-[1.04]" sizes="(min-width:1024px) 50vw, 100vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" aria-hidden />
                {hasVideo ? (
                  <span className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-white/15 backdrop-blur-md">
                    <Play size={16} fill="currentColor" />
                  </span>
                ) : null}
                <div className="absolute right-5 bottom-5 left-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="t-eyebrow text-white/60">
                      {p.client} · {p.service?.title ?? p.category}
                    </p>
                    <h3 className="t-h3 mt-1">{p.title}</h3>
                  </div>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-ink transition-transform duration-300 group-hover:rotate-45">
                    <ArrowUpRight size={18} />
                  </span>
                </div>
              </Link>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
