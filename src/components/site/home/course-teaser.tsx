import { useTranslations } from "next-intl";
import { Reveal } from "@/components/motion/reveal";
import { AllCoursesLink, CourseTile } from "@/components/site/course/course-tile";
import type { CourseTileData } from "@/components/site/course/course-tile-data";
import { SectionHeading } from "@/components/ui/section-heading";

/**
 * Homepage course grid: the first `limit` courses (featured first, then admin order) as compact cards on
 * phones, followed by a small "view all courses" link. Fully server-rendered: no client code, nothing to hydrate.
 */
export function CourseTeaser({ courses, limit }: { courses: CourseTileData[]; limit: number }) {
  const t = useTranslations("courseIndex");
  const tc = useTranslations("common");
  // Array#sort is stable, so the loader's admin order survives inside the featured / regular groups.
  const shown = [...courses].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, limit);

  return (
    <section className="section-y relative" aria-labelledby="courses-title" data-nav="/kurslar">
      <div className="container-x">
        <SectionHeading eyebrow={tc("nav.courses")} title={<span id="courses-title">{t("title")}</span>} lead={t("lead")} align="split" />
        {/* 2 columns from phones up (compact cards below `sm`), 3 on desktop. */}
        <Reveal as="ol" stagger={0.06} y={24} className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
          {shown.map((c, i) => (
            <li key={c.id}>
              <CourseTile course={c} n={i + 1} compact />
            </li>
          ))}
        </Reveal>
        <AllCoursesLink more={courses.length - shown.length} />
      </div>
    </section>
  );
}
