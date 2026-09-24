import Link from "next/link";
import { ArrowUpRight, Check, Quote } from "lucide-react";
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
export function CourseBody({ course, branches }: { course: CourseDetail; branches: LeadFormOption[] }) {
  const curriculum = (course.curriculum as Module[] | null) ?? [];
  const projects = (course.projects as Project[] | null) ?? [];
  const teachers = course.teachers.map((t) => t.teacher).filter((t) => t.status === "PUBLISHED");
  const anchors = [
    ["kimlar-uchun", "Kimlar uchun"],
    curriculum.length ? ["dastur", "Dastur"] : null,
    course.skills.length ? ["konikmalar", "Koʻnikmalar"] : null,
    projects.length ? ["loyihalar", "Loyihalar"] : null,
    course.outcomes.length ? ["natija", "Natija"] : null,
    teachers.length ? ["mentor", "Mentor"] : null,
    course.faqs.length ? ["faq", "FAQ"] : null,
  ].filter(Boolean) as [string, string][];

  return (
    <div className="container-x grid gap-12 pb-24 lg:grid-cols-12">
      <div className="min-w-0 lg:col-span-7">
        <nav aria-label="Kurs boʻlimlari" className="sticky top-20 z-10 -mx-(--gutter) mb-4 overflow-x-auto bg-paper/85 px-(--gutter) py-3 backdrop-blur-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

        <Block id="kimlar-uchun" eyebrow="Kimlar uchun" title="Bu kurs siz uchun, agar…">
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
          <Block id="dastur" eyebrow="Oʻquv dasturi" title={`${curriculum.length} ta modul`}>
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
          <Block id="konikmalar" eyebrow="Koʻnikmalar" title="Nimalarni oʻrganasiz">
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
          <Block id="loyihalar" eyebrow="Amaliyot" title="Kurs davomida yaratadigan loyihalaringiz">
            <ol className="grid gap-4 sm:grid-cols-2">
              {projects.map((p, i) => (
                <li key={p.title} className="rounded-(--radius-lg) border border-(--line) p-5">
                  <p className="t-meta text-orange">Loyiha {pad2(i + 1)}</p>
                  <h3 className="t-h4 mt-2">{p.title}</h3>
                  {p.description ? <p className="mt-2 text-(--fg-muted)">{p.description}</p> : null}
                </li>
              ))}
            </ol>
          </Block>
        ) : null}

        {course.outcomes.length ? (
          <Block id="natija" eyebrow="Natija" title="Kursdan keyin nima qila olasiz">
            <ol className="space-y-3">
              {course.outcomes.map((o, i) => (
                <li key={o} className="flex items-center gap-4 rounded-(--radius-lg) bg-ink p-5 text-white">
                  <span className="font-display text-2xl font-bold text-orange">{pad2(i + 1)}</span>
                  <span className="t-h4">{o}</span>
                </li>
              ))}
            </ol>
          </Block>
        ) : null}

        {teachers.length ? (
          <Block id="mentor" eyebrow="Mentor" title={teachers.length > 1 ? "Mentorlar" : "Mentor"}>
            <ul className="grid gap-6 sm:grid-cols-2">
              {teachers.map((t) => (
                <li key={t.id} className="flex gap-4">
                  <PlaceholderImage src={t.photo} alt={t.name} className="size-20 shrink-0 rounded-(--radius-lg)" sizes="80px" />
                  <div>
                    <h3 className="t-h4">{t.name}</h3>
                    <p className="text-sm text-orange">{t.title}</p>
                    {t.bio ? <p className="mt-2 text-sm text-(--fg-muted)">{t.bio}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          </Block>
        ) : null}

        {course.testimonials.length ? (
          <Block id="fikrlar" eyebrow="Bitiruvchilar" title="Ular nima deydi">
            <ul className="grid gap-4 sm:grid-cols-2">
              {course.testimonials.map((t) => (
                <li key={t.id} className="rounded-(--radius-lg) border border-(--line) p-6">
                  <Quote size={20} className="text-orange" />
                  <p className="mt-3">{t.quote}</p>
                  <p className="mt-4 font-semibold">{t.name}</p>
                  <p className="text-sm text-(--fg-muted)">{t.resultLabel ?? t.role}</p>
                </li>
              ))}
            </ul>
          </Block>
        ) : null}

        {course.faqs.length ? (
          <Block id="faq" eyebrow="FAQ" title="Savollar">
            <Accordion items={course.faqs.map((f) => ({ id: f.id, title: f.question, content: <p>{f.answer}</p> }))} />
          </Block>
        ) : null}

        <div className="border-t border-(--line) pt-10">
          <Link href={routes.courses} className="inline-flex items-center gap-1 font-semibold text-orange hover:underline">
            Boshqa kurslar <ArrowUpRight size={16} />
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
