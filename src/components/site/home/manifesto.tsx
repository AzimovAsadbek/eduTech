import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import type { GalleryItem } from "@prisma/client";

/**
 * TRUST: "Why EduTech" as a manifesto — a big statement, six short beliefs
 * laid out as an editorial ledger, and a photo strip that fills with real gallery assets.
 */
export async function Manifesto({ gallery }: { gallery: GalleryItem[] }) {
  const t = await getTranslations("manifesto");
  const statements = t.raw("statements") as { title: string; text: string }[];
  const photoLabels = t.raw("photoLabels") as string[];
  const photos = gallery.slice(0, 4);
  return (
    <section className="section-y bg-paper-2" aria-labelledby="why-title" data-nav="/biz-haqimizda">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Eyebrow className="mb-4">{t("eyebrow")}</Eyebrow>
            <SplitHeading as="h2" id="why-title" text={t("title")} accent={t.raw("accent") as string[]} className="t-h1" />
            <Reveal delay={0.2}>
              <p className="t-lead mt-6 max-w-md">{t("lead")}</p>
            </Reveal>
          </div>
          <Reveal stagger={0.08} as="ol" className="grid gap-x-10 sm:grid-cols-2 lg:col-span-7">
            {statements.map((s, i) => (
              <li key={s.title} className="border-t border-(--line) py-6">
                <p className="t-meta text-orange">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="t-h4 mt-2">{s.title}</h3>
                <p className="mt-2 text-(--fg-muted)">{s.text}</p>
              </li>
            ))}
          </Reveal>
        </div>

        <Reveal stagger={0.08} className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(photos.length ? photos : [null, null, null, null]).map((p, i) => (
            <PlaceholderImage
              key={p?.id ?? i}
              src={p?.image}
              alt={p?.alt ?? t("photoAlt")}
              label={p ? undefined : photoLabels[i]}
              className={`aspect-[4/5] rounded-(--radius-lg) ${i % 2 ? "sm:translate-y-6" : ""}`}
              sizes="(min-width:640px) 25vw, 50vw"
            />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
