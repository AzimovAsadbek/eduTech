import { Link } from "@/i18n/navigation";
import { ArrowUpRight, Check, Quote } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/motion/reveal";
import { Accordion } from "@/components/ui/accordion";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PlaceholderImage } from "@/components/ui/placeholder-image";
import { routes } from "@/config/site";
import { pad2 } from "@/lib/utils";
import type { CourseDetail } from "@/server/modules/content/public";
import type { LeadFormOption } from "@/components/site/lead-form";
import { CourseApply } from "./course-apply";

type Module = { title: string; lessons: string[] };
type Project = { title: string; description?: string };

function Block({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <Reveal as="section" className="scroll-mt-28 border-t border-(--line) py-12" id={id}>
      <Eyebrow className="mb-3">{eyebrow}</Eyebrow>
      <h2 className="t-h2 mb-8">{title}</h2>
      {children}
    </Reveal>
  );
}

/** Long-form course content on the left, the application form pinned on the right (desktop). */
export async function CourseBody({ course, branches }: { course: CourseDetail; branches: LeadFormOption[] }) {
  const t = await getTranslations("courseBody");
  const curriculum = (course.curriculum as Module[] | null) ?? [];
  const projects = (course.projects as Project[] | null) ?? [];
  const teachers = course.teachers.map((x) => x.teacher).filter((x) => x.status === "PUBLISHED");
  const anchors = [
    ["kimlar-uchun", t("anchors.whoFor")],
    curriculum.length ? ["dastur", t("anchors.curriculum")] : null,
    course.skills.length ? ["konikmalar", t("anchors.skills")] : null,
    projects.length ? ["loyihalar", t("anchors.projects")] : null,
    course.outcomes.length ? ["natija", t("anchors.outcomes")] : null,
    teachers.length ? ["mentor", t("anchors.mentor")] : null,
    course.faqs.length ? ["faq", t("anchors.faq")] : null,
  ].filter(Boolean) as [string, string][];

  return (
    <div className="container-x grid gap-12 pb-24 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-7">
        <nav aria-label={t("sectionsNav")} className="sticky top-20 z-10 -mx-(--gutter) mb-4 overflow-x-auto bg-paper/85 px-(--gutter) py-3 backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <ul className="flex gap-2">
            {anchors.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="t-meta inline-flex h-8 items-center rounded-full border border-(--line) px-3 whitespace-nowrap hover:border-orange hover:text-orange">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <Block id="kimlar-uchun" eyebrow={t("whoFor.eyebrow")} title={t("whoFor.title")}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {course.whoFor.map((w) => (
              <li key={w} className="flex items-start gap-3 rounded-(--radius-md) bg-paper-2 p-4">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-orange text-white">
                  <Check size={14} />
                </span>
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </Block>

        {curriculum.length ? (
          <Block id="dastur" eyebrow={t("curriculum.eyebrow")} title={t("curriculum.title", { count: curriculum.length })}>
            <Accordion
              defaultOpen="m0"
              items={curriculum.map((m, i) => ({
                id: `m${i}`,
                meta: pad2(i + 1),
                title: m.title,
                content: (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {m.lessons.map((l) => (
                      <li key={l} className="flex items-start gap-2 text-(--fg)">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-orange" aria-hidden />
                        {l}
                      </li>
                    ))}
                  </ul>
                ),
              }))}
            />
          </Block>
        ) : null}

        {course.skills.length ? (
          <Block id="konikmalar" eyebrow={t("skills.eyebrow")} title={t("skills.title")}>
            <ul className="flex flex-wrap gap-2">
              {course.skills.map((s) => (
                <li key={s} className="rounded-full border border-(--line) px-4 py-2 font-medium">
                  {s}
                </li>
              ))}
            </ul>
          </Block>
        ) : null}

        {projects.length ? (
          <Block id="loyihalar" eyebrow={t("projects.eyebrow")} title={t("projects.title")}>
            <ol className="grid gap-4 sm:grid-cols-2">
              {projects.map((p, i) => (
                <li key={p.title} className="rounded-(--radius-lg) border border-(--line) p-5">
                  <p className="t-meta text-orange">{t("projects.item", { n: pad2(i + 1) })}</p>
                  <h3 className="t-h4 mt-2">{p.title}</h3>
                  {p.description ? <p className="mt-2 text-(--fg-muted)">{p.description}</p> : null}
                </li>
              ))}
            </ol>
          </Block>
        ) : null}

        {course.outcomes.length ? (
          <Block id="natija" eyebrow={t("outcomes.eyebrow")} title={t("outcomes.title")}>
            <ol className="grid gap-3 sm:grid-cols-2">
              {course.outcomes.map((o, i) => (
                <li key={o} className="relative flex items-start gap-4 overflow-hidden rounded-(--radius-lg) border border-orange/15 bg-orange-soft/50 p-5 before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-orange">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-orange text-white">
                    <Check size={16} />
                  </span>
                  <span>
                    <span className="t-meta block text-orange">{pad2(i + 1)}</span>
                    <span className="mt-0.5 block font-semibold leading-snug">{o}</span>
                  </span>
                </li>
              ))}
            </ol>
          </Block>
        ) : null}

        {teachers.length ? (
          <Block id="mentor" eyebrow={t("mentor.eyebrow")} title={t("mentor.title", { count: teachers.length })}>
            <ul className="grid gap-6 sm:grid-cols-2">
              {teachers.map((m) => (
                <li key={m.id} className="flex gap-4">
                  <PlaceholderImage src={m.photo} alt={m.name} className="size-20 shrink-0 rounded-(--radius-lg)" sizes="80px" />
                  <div>
                    <h3 className="t-h4">{m.name}</h3>
                    <p className="text-sm text-orange">{m.title}</p>
                    {m.bio ? <p className="mt-2 text-sm text-(--fg-muted)">{m.bio}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          </Block>
        ) : null}

        {course.testimonials.length ? (
          <Block id="fikrlar" eyebrow={t("testimonials.eyebrow")} title={t("testimonials.title")}>
            <ul className="grid gap-4 sm:grid-cols-2">
              {course.testimonials.map((q) => (
                <li key={q.id} className="rounded-(--radius-lg) border border-(--line) p-6">
                  <Quote size={20} className="text-orange" />
                  <p className="mt-3">{q.quote}</p>
                  <p className="mt-4 font-semibold">{q.name}</p>
                  <p className="text-sm text-(--fg-muted)">{q.resultLabel ?? q.role}</p>
                </li>
              ))}
            </ul>
          </Block>
        ) : null}

        {course.faqs.length ? (
          <Block id="faq" eyebrow={t("faq.eyebrow")} title={t("faq.title")}>
            <Accordion items={course.faqs.map((f) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p> }))} />
          </Block>
        ) : null}

        <div className="border-t border-(--line) pt-10">
          <Link href={routes.courses} className="inline-flex items-center gap-1 font-semibold text-orange hover:underline">
            {t("otherCourses")} <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      <aside className="min-w-0 lg:col-span-5">
        <div className="lg:sticky lg:top-24">
          <CourseApply course={{ slug: course.slug, title: course.title, priceLabel: course.priceLabel, durationLabel: course.durationLabel }} branches={branches} />
        </div>
      </aside>
    </div>
  );
}
