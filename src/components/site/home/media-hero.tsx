import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { routes } from "@/config/site";

/** MEDIA world entry: cinematic dark, one light leak, two CTAs. */
export function MediaHero({ standalone }: { standalone?: boolean }) {
  return (
    <section data-world="media" className={`relative overflow-hidden bg-(--surface) text-white ${standalone ? "pt-36 pb-20 lg:pt-44 lg:pb-28" : "section-y"}`} aria-labelledby="media-title">
      <div aria-hidden className="pointer-events-none absolute top-0 left-1/2 h-[60vh] w-[90vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,107,26,.28),transparent)] blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute inset-0 grain" />
      <div className="container-x relative grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <Eyebrow className="mb-6 text-white/60">EduTech Media · bizneslar uchun</Eyebrow>
          <SplitHeading as={standalone ? "h1" : "h2"} id="media-title" text="Brendingizni kontent orqali koʻrsating." accent={["kontent"]} className={standalone ? "t-display" : "t-h1"} />
        </div>
        <Reveal className="lg:col-span-4">
          <p className="t-lead text-white/70">Biznesingiz uchun kreativ kontent, SMM va raqamli marketing xizmatlarini bir joyda.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" href="#media-inquiry" magnetic icon={<ArrowUpRight size={18} />}>
              Buyurtma berish
            </Button>
            <Button size="lg" variant="outline-inverse" href={routes.portfolio}>
              Portfolio koʻrish
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
