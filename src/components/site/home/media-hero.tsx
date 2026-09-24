import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { routes } from "@/config/site";

/** MEDIA world entry: cinematic dark, one light leak, two CTAs. */
export async function MediaHero({ standalone }: { standalone?: boolean }) {
  const [t, tc] = await Promise.all([getTranslations("mediaHero"), getTranslations("common.actions")]);
  return (
    <section data-world="media" data-nav="/media" className={`relative overflow-hidden bg-(--surface) text-white ${standalone ? "pt-36 pb-20 lg:pt-44 lg:pb-28" : "section-y"}`} aria-labelledby="media-title">
      <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-[60vh] w-[90vw] -translate-x-1/2"><div className="light-leak size-full rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.3),transparent)] blur-3xl" /></div>
      <div aria-hidden className="pointer-events-none absolute inset-0 grain" />
      <div className="container-x relative grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <Eyebrow className="mb-6 text-white/60">{t("eyebrow")}</Eyebrow>
          <SplitHeading as={standalone ? "h1" : "h2"} id="media-title" text={t("title")} accent={t.raw("accent") as string[]} className={standalone ? "t-display" : "t-h1"} />
        </div>
        <Reveal className="lg:col-span-4">
          <p className="t-lead text-white/70">{t("lead")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" href="#media-inquiry" magnetic icon={<ArrowUpRight size={18} />}>
              {tc("order")}
            </Button>
            <Button size="lg" variant="outline-inverse" href={routes.portfolio}>
              {tc("viewPortfolio")}
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
