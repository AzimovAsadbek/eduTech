import { Clock, MapPin, Users, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import type { CourseDetail } from "@/server/modules/content/public";

export async function CourseHero({ course }: { course: CourseDetail }) {
  const [t, tc] = await Promise.all([getTranslations("courseHero"), getTranslations("common")]);
  const facts = [
    { icon: Clock, l: t("duration"), v: course.durationLabel },
    { icon: MapPin, l: t("format"), v: `${tc(`format.${course.format}`)}${course.schedule ? ` · ${course.schedule}` : ""}` },
    { icon: Users, l: t("level"), v: `${tc(`level.${course.level}`)}${course.ageLabel ? ` · ${course.ageLabel}` : ""}` },
    { icon: Wallet, l: t("price"), v: course.priceLabel ?? t("priceOnRequest") },
  ];
  return (
    <section className="relative overflow-hidden pt-32 pb-12 lg:pt-40 lg:pb-16" style={{ ["--accent" as string]: course.accent ?? "#FF6B1A" }}>
      <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] h-[60vh] w-[55vw] rounded-full bg-[radial-gradient(closest-side,color-mix(in_srgb,var(--accent)_25%,transparent),transparent)] blur-3xl" />
      <div className="container-x grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Eyebrow className="mb-5">
            {course.category?.name ?? t("fallbackCategory")} · {course.roleLabel}
          </Eyebrow>
          <SplitHeading as="h1" text={course.title} className="t-display" scroll={false} />
          <Reveal delay={0.3}>
            <p className="t-h3 mt-6 font-normal text-orange">{course.tagline}</p>
            <p className="t-lead mt-5 max-w-xl">{course.description}</p>
          </Reveal>
          <Reveal stagger={0.06} as="dl" className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-(--line) pt-8 sm:grid-cols-4" delay={0.4}>
            {facts.map((f) => (
              <div key={f.l}>
                <dt className="t-meta flex items-center gap-1.5 text-(--fg-muted)">
                  <f.icon size={14} /> {f.l}
                </dt>
                <dd className="mt-1.5 font-semibold">{f.v}</dd>
              </div>
            ))}
          </Reveal>
        </div>
        <Reveal className="lg:col-span-5" delay={0.2}>
          <PlaceholderImage src={course.coverImage} alt={t("coverAlt", { title: course.title })} label={t("coverLabel")} className="aspect-[4/5] rounded-(--radius-xl) shadow-lg lg:aspect-[4/4.6]" priority sizes="(min-width:1024px) 40vw, 100vw" />
        </Reveal>
      </div>
    </section>
  );
}
