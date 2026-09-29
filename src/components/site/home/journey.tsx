import { useTranslations } from "next-intl";
import type { CSSProperties } from "react";
import { Eyebrow } from "@/components/ui/eyebrow";
import { cn } from "@/lib/utils";
import { JourneySteps } from "./journey-steps";

interface Step {
  n: string;
  tag: string;
  title: string;
  text: string;
  detail: string;
}

/** Steps warm up one tone at a time; the last step is the destination and uses the solid `--goal` surface. */
const TONES = [
  { surface: "lg:bg-paper-3", badge: "border border-ink/15 bg-paper" },
  { surface: "lg:bg-orange-soft", badge: "border border-orange/30 bg-orange-soft" },
  { surface: "lg:bg-orange/[0.17]", badge: "border border-orange/50 bg-orange/[0.17]" },
];

/*
 * Entrance choreography (triggered once by JourneySteps). Parts are hidden/offset only while the list is
 * `pending` and motion is allowed; transitions exist only in the `in` state, so going pending is instant.
 * Everything is transform/opacity. `--i` is the step index, set inline on each <li>.
 */
/** Each step rises into place: every 200ms on phones, every 90ms on desktop. */
const STEP_ENTER =
  "motion-safe:group-data-[state=pending]/steps:translate-y-4 motion-safe:group-data-[state=pending]/steps:opacity-0 lg:motion-safe:group-data-[state=pending]/steps:translate-y-8 group-data-[state=in]/steps:transition-[opacity,translate] group-data-[state=in]/steps:duration-700 group-data-[state=in]/steps:ease-(--ease-out) group-data-[state=in]/steps:delay-[calc(var(--i)*200ms)] lg:group-data-[state=in]/steps:delay-[calc(var(--i)*90ms)]";
/** Mobile: the connector below badge i fills downwards and reaches badge i+1 as that step arrives. */
const FILL_ENTER =
  "motion-safe:group-data-[state=pending]/steps:scale-y-0 group-data-[state=in]/steps:transition-[scale] group-data-[state=in]/steps:duration-300 group-data-[state=in]/steps:ease-(--ease-in-out) group-data-[state=in]/steps:delay-[calc(var(--i)*200ms_+_120ms)]";
/** Desktop: the stair line is drawn like one pen stroke, 380ms per step — riser up, then tread across. */
const RISER_ENTER =
  "motion-safe:group-data-[state=pending]/steps:scale-y-0 group-data-[state=in]/steps:transition-[scale] group-data-[state=in]/steps:duration-100 group-data-[state=in]/steps:ease-linear group-data-[state=in]/steps:delay-[calc(var(--i)*380ms_+_280ms)]";
const TREAD_ENTER =
  "motion-safe:group-data-[state=pending]/steps:scale-x-0 group-data-[state=in]/steps:transition-[scale] group-data-[state=in]/steps:duration-300 group-data-[state=in]/steps:ease-linear group-data-[state=in]/steps:delay-[calc(var(--i)*380ms_+_380ms)]";
/** Desktop: the arrival marker pops where the stroke meets the goal. */
const ARRIVE_ENTER =
  "motion-safe:group-data-[state=pending]/steps:scale-0 group-data-[state=in]/steps:transition-[scale] group-data-[state=in]/steps:duration-500 group-data-[state=in]/steps:ease-(--ease-out) group-data-[state=in]/steps:delay-[calc(var(--i)*380ms_+_280ms)]";

/** Connector opacity (in %) at badge `i`: the mobile line warms up towards the goal. */
const heat = (i: number, last: number) => Math.round(30 + (70 * i) / Math.max(last, 1));

/**
 * DISCOVERY: the education model, Bilim → Koʻnikma → Tajriba → Kasb.
 * Desktop: an ascending staircase. Each step's top edge sits one riser higher, a thin orange line climbs the step
 * tops into the last step, a solid orange destination. Stage tags, titles, sentences and details share rows across
 * the columns (subgrid), so only the tops and numerals climb. Mobile: a compact numbered progression whose connector
 * fills as the steps arrive, docking into the destination card. One server-rendered list serves both layouts;
 * the only client code is the entrance trigger in JourneySteps.
 */
export function Journey() {
  const t = useTranslations("journey");
  const steps = t.raw("steps") as Step[];
  const last = steps.length - 1;

  return (
    <section className="section-y relative" aria-labelledby="journey-title">
      <div className="container-x">
        <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-6">
          <div className="lg:col-span-7">
            <Eyebrow className="mb-4">{t("eyebrow")}</Eyebrow>
            <h2 id="journey-title" className="t-h2">
              {t("title")} <span className="block text-orange-deep">{t("titleAccent")}</span>
            </h2>
          </div>
          <p className="t-lead max-w-md lg:col-span-4 lg:col-start-9">{t("lead")}</p>
        </div>

        <JourneySteps
          className="group/steps mt-7 sm:max-w-xl [--goal:color-mix(in_srgb,var(--color-orange-deep)_86%,var(--color-ink))] [--rise:clamp(2.25rem,3.9vw,3.5rem)] lg:mt-16 lg:grid lg:max-w-none lg:grid-cols-[repeat(var(--n),minmax(0,1fr))] lg:grid-rows-[repeat(5,auto)]"
          style={{ "--n": steps.length } as CSSProperties}
        >
          {steps.map((s, i) => {
            const goal = i === last;
            const tone = TONES[Math.min(i, TONES.length - 1)];
            return (
              <li
                key={s.n}
                style={{ "--i": i } as CSSProperties}
                className={cn(
                  "relative isolate grid grid-cols-[2.25rem_minmax(0,1fr)] gap-x-4",
                  // Mobile: the destination is a solid card that starts at the badge's centre, so the last node docks into it.
                  goal
                    ? "py-4 pr-4 text-white before:absolute before:inset-y-0 before:right-0 before:left-[1.125rem] before:-z-10 before:rounded-(--radius-lg) before:bg-(--goal) lg:before:hidden"
                    : "pb-4",
                  // Desktop: one column of the staircase, its top (n-1-i) risers below the goal's. Rows come from the list (subgrid).
                  "lg:row-span-5 lg:mt-[calc((var(--n)_-_1_-_var(--i))*var(--rise))] lg:grid-cols-1 lg:grid-rows-subgrid lg:gap-x-0 lg:p-6 lg:pb-7 xl:px-7",
                  goal ? "lg:rounded-t-(--radius-lg) lg:rounded-br-(--radius-lg) lg:bg-(--goal) lg:shadow-[0_28px_60px_-30px_rgba(229,86,10,.6)]" : tone.surface,
                  i === 0 && "lg:rounded-bl-(--radius-lg)",
                  STEP_ENTER,
                )}
              >
                {/* Mobile connector to the next badge: a hairline track that fills in orange, warmer towards the goal. */}
                {!goal ? (
                  <span aria-hidden className={cn("absolute top-11 left-[1.125rem] w-0.5 -translate-x-1/2 rounded-full bg-(--line) lg:hidden", i === last - 1 ? "-bottom-2" : "bottom-2")}>
                    <span
                      className={cn("block size-full origin-top rounded-full", FILL_ENTER)}
                      style={{
                        backgroundImage: `linear-gradient(to bottom, color-mix(in srgb, var(--color-orange) ${heat(i, last)}%, transparent), color-mix(in srgb, var(--color-orange) ${heat(i + 1, last)}%, transparent))`,
                      }}
                    />
                  </span>
                ) : null}

                {/* Desktop stair line: riser up this step's exposed left side, tread along its top; it starts at a dot and ends at the goal. */}
                {i === 0 ? <span aria-hidden className="absolute -top-[5px] -left-[5px] hidden size-2.5 rounded-full bg-orange lg:block" /> : null}
                {i > 0 && !goal ? (
                  <span aria-hidden className={cn("absolute top-0 -left-px hidden h-(--rise) w-0.5 origin-bottom bg-orange lg:block", RISER_ENTER)} />
                ) : null}
                {!goal ? <span aria-hidden className={cn("absolute inset-x-0 -top-px hidden h-0.5 origin-left bg-orange lg:block", TREAD_ENTER)} /> : null}
                {goal ? (
                  <span
                    aria-hidden
                    className={cn("absolute top-[calc(var(--rise)_-_6px)] -left-1.5 hidden size-3 rounded-full border-2 border-orange bg-paper lg:block", ARRIVE_ENTER)}
                  />
                ) : null}

                <span
                  aria-hidden
                  className={cn(
                    "font-display relative grid size-9 place-items-center rounded-full text-sm font-semibold lg:hidden",
                    goal ? "bg-paper text-(--goal) ring-2 ring-(--goal) ring-inset" : tone.badge,
                  )}
                >
                  {s.n}
                </span>
                {/* Desktop numeral: climbs with its step and grows a size per step. */}
                <span
                  aria-hidden
                  className={cn(
                    "font-display hidden text-[calc(clamp(2.5rem,3.4vw,3rem)_+_var(--i)*clamp(0.5rem,1vw,0.875rem))] leading-[0.8] font-semibold tracking-[-0.05em] lg:row-start-1 lg:block",
                    goal ? "text-white" : "text-orange-deep",
                  )}
                >
                  {s.n}
                </span>

                <div className="min-w-0 pt-1.5 lg:contents">
                  <div className="flex items-baseline justify-between gap-3 lg:contents">
                    <h3 className="t-h4 lg:t-h3 lg:row-start-3 lg:mt-2.5">{s.title}</h3>
                    <p className={cn("t-eyebrow flex shrink-0 items-center gap-1.5 lg:row-start-2 lg:mt-8", goal ? "text-white" : "text-ink/65")}>
                      <span aria-hidden className={cn("size-1.5 rounded-full", goal ? "bg-white" : "bg-orange")} />
                      {s.tag}
                    </p>
                  </div>
                  <p className={cn("mt-0.5 text-[0.9375rem] leading-[1.45] lg:row-start-4 lg:mt-3 lg:text-base lg:leading-normal", goal ? "text-white" : "text-ink/70")}>{s.text}</p>
                  <p className={cn("t-meta mt-1.5 leading-4 lg:row-start-5 lg:mt-0 lg:pt-7", goal ? "text-white" : "text-ink/60")}>{s.detail}</p>
                </div>
              </li>
            );
          })}
        </JourneySteps>
      </div>
    </section>
  );
}
