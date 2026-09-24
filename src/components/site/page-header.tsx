import { Reveal } from "@/components/motion/reveal";
import { SplitHeading } from "@/components/motion/split-heading";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";

interface Props {
  eyebrow: string;
  title: string;
  accent?: string[];
  lead?: React.ReactNode;
  children?: React.ReactNode;
  dark?: boolean;
  className?: string;
}

/** Inner-page opener: eyebrow, split-revealed H1, lead. Editorial, not a "banner". */
export function PageHeader({ eyebrow, title, accent, lead, children, dark, className }: Props) {
  return (
    <section data-world={dark ? "media" : undefined} className={cn("relative overflow-hidden pt-36 pb-16 lg:pt-44 lg:pb-20", dark ? "bg-(--surface) text-white" : "", className)}>
      <div aria-hidden className="pointer-events-none absolute -top-32 right-[-10%] h-[50vh] w-[50vw] rounded-full bg-[radial-gradient(closest-side,rgba(254,126,3,.18),transparent)] blur-3xl" />
      <div className="container-x grid gap-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <Eyebrow className={cn("mb-5", dark && "text-white/60")}>{eyebrow}</Eyebrow>
          <SplitHeading as="h1" text={title} accent={accent} className="t-display" scroll={false} />
        </div>
        {lead || children ? (
          <Reveal className="lg:col-span-4" delay={0.3}>
            {lead ? <p className={cn("t-lead", dark && "text-white/70")}>{lead}</p> : null}
            {children}
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
