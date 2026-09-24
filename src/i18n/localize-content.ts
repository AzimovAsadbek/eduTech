import { localize, localizeAll } from "./localize";
import type { Locale } from "./routing";

type Row = { translations?: unknown };
type Maybe<T> = T | null | undefined;

/** Localises `row[key]` in place of the original, whether it is a single relation or a list. */
function nested<T extends Row, K extends keyof T>(row: T, key: K, locale: Locale): T {
  const value = row[key] as unknown;
  if (!value) return row;
  const localized = Array.isArray(value) ? localizeAll(value as Row[], locale) : localize(value as Row, locale);
  return { ...row, [key]: localized };
}

/** Course card / list row: the course and its category. */
export function localizeCourse<T extends Row & { category?: Maybe<Row> }>(course: T, locale: Locale): T {
  return locale === "uz" ? course : nested(localize(course, locale), "category", locale);
}

export function localizeCourses<T extends Row & { category?: Maybe<Row> }>(courses: T[], locale: Locale): T[] {
  return locale === "uz" ? courses : courses.map((c) => localizeCourse(c, locale));
}

/** Course detail: category, teachers, testimonials, results and FAQs. */
export function localizeCourseDetail<
  T extends Row & { category?: Maybe<Row>; teachers?: { teacher: Row }[]; testimonials?: Row[]; results?: Row[]; faqs?: Row[] },
>(course: T, locale: Locale): T {
  if (locale === "uz") return course;
  let out = localizeCourse(course, locale);
  out = nested(out, "testimonials", locale);
  out = nested(out, "results", locale);
  out = nested(out, "faqs", locale);
  if (out.teachers) out = { ...out, teachers: out.teachers.map((ct) => ({ ...ct, teacher: localize(ct.teacher, locale) })) };
  return out;
}

/** Service (optionally with its projects). */
export function localizeService<T extends Row & { projects?: Row[] }>(service: T, locale: Locale): T {
  return locale === "uz" ? service : nested(localize(service, locale), "projects", locale);
}

/** Media project with its optional parent service. */
export function localizeProject<T extends Row & { service?: Maybe<Row> }>(project: T, locale: Locale): T {
  return locale === "uz" ? project : nested(localize(project, locale), "service", locale);
}

export function localizeProjects<T extends Row & { service?: Maybe<Row> }>(projects: T[], locale: Locale): T[] {
  return locale === "uz" ? projects : projects.map((p) => localizeProject(p, locale));
}

/** Results / testimonials that reference a course. */
export function localizeWithCourse<T extends Row & { course?: Maybe<Row> }>(rows: T[], locale: Locale): T[] {
  return locale === "uz" ? rows : rows.map((r) => nested(localize(r, locale), "course", locale));
}

/** Teachers with the courses they teach. */
export function localizeTeachers<T extends Row & { courses?: { course: Row }[] }>(teachers: T[], locale: Locale): T[] {
  if (locale === "uz") return teachers;
  return teachers.map((t) => {
    const out = localize(t, locale);
    return out.courses ? { ...out, courses: out.courses.map((ct) => ({ ...ct, course: localize(ct.course, locale) })) } : out;
  });
}
