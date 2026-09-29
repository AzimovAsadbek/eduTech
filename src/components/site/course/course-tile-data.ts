import type { CourseCard } from "@/server/modules/content/public";

/**
 * Exactly what a course card renders. Pages map their (already localised) course rows to this before
 * handing them to the client-side catalogue, so the page payload does not carry fields the card never
 * shows (the outcome lists, admin ordering, stored translations for the other languages).
 */
export interface CourseTileData {
  id: string;
  slug: string;
  title: string;
  roleLabel: string;
  tagline: string;
  level: CourseCard["level"];
  format: CourseCard["format"];
  durationLabel: string;
  priceLabel: string | null;
  ageLabel: string | null;
  accent: string | null;
  coverImage: string | null;
  featured: boolean;
  category: { id: string; slug: string; name: string } | null;
}

export function toCourseTile(c: CourseCard): CourseTileData {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    roleLabel: c.roleLabel,
    tagline: c.tagline,
    level: c.level,
    format: c.format,
    durationLabel: c.durationLabel,
    priceLabel: c.priceLabel,
    ageLabel: c.ageLabel,
    accent: c.accent,
    coverImage: c.coverImage,
    featured: c.featured,
    category: c.category ? { id: c.category.id, slug: c.category.slug, name: c.category.name } : null,
  };
}
