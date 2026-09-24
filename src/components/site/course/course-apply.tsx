"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { LeadForm, type LeadFormOption } from "@/components/site/lead-form";

interface Props {
  course: { slug: string; title: string; priceLabel?: string | null; durationLabel: string };
  branches: LeadFormOption[];
}

/** The application is the natural end of the course page — same form, pre-bound to this course. */
export function CourseApply({ course, branches }: Props) {
  const t = useTranslations("courseApply");
  const tc = useTranslations("common.actions");
  useEffect(() => {
    track("course_view", { course: course.slug });
  }, [course.slug]);

  return (
    <div id="ariza" className="glass relative overflow-hidden rounded-(--radius-xl) p-6 sm:p-8">
      <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 size-56 rounded-full bg-orange/25 blur-3xl" />
      <p className="t-eyebrow text-orange">{tc("apply")}</p>
      <h2 className="t-h3 mt-2">{course.title}</h2>
      <p className="mt-1 text-sm text-(--fg-muted)">
        {course.durationLabel}
        {course.priceLabel ? ` · ${course.priceLabel}` : ` · ${t("priceOnRequest")}`}
      </p>
      <div className="mt-6">
        <LeadForm type="EDUCATION" courses={[{ value: course.slug, label: course.title }]} branches={branches} defaultCourseSlug={course.slug} source={`course:${course.slug}`} submitLabel={t("submit")} />
      </div>
    </div>
  );
}
