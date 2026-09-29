import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({ getTranslations: vi.fn() }));
vi.mock("@/i18n/navigation", () => ({ Link: () => null }));

import type { CourseTileData } from "@/components/site/course/course-tile-data";
import { pickRelated } from "@/components/site/course/related-courses";

const course = (id: string, categoryId: string | null, featured = false): CourseTileData => ({
  id,
  slug: id,
  title: id,
  roleLabel: "",
  tagline: "",
  level: "BEGINNER",
  format: "OFFLINE",
  durationLabel: "6 oy",
  priceLabel: null,
  ageLabel: null,
  accent: null,
  coverImage: null,
  featured,
  category: categoryId ? { id: categoryId, slug: categoryId, name: categoryId } : null,
});

// Admin order: a (it), b (kids, featured), c (it), d (media), e (media, featured), f (it)
const all = [course("a", "it"), course("b", "kids", true), course("c", "it"), course("d", "media"), course("e", "media", true), course("f", "it")];

describe("pickRelated", () => {
  it("never suggests the course being viewed", () => {
    expect(pickRelated(all, { id: "a", categoryId: "it" }).map((c) => c.id)).not.toContain("a");
  });

  it("puts the same category first, then featured courses, keeping the admin order within each group", () => {
    expect(pickRelated(all, { id: "a", categoryId: "it" }).map((c) => c.id)).toEqual(["c", "f", "b", "e"]);
  });

  it("falls back to featured, then admin order, when the course has no category", () => {
    expect(pickRelated(all, { id: "d", categoryId: null }, 3).map((c) => c.id)).toEqual(["b", "e", "a"]);
  });

  it("respects the limit and handles a short catalogue", () => {
    expect(pickRelated(all, { id: "a", categoryId: "it" }, 2)).toHaveLength(2);
    expect(pickRelated([course("x", "it")], { id: "x", categoryId: "it" })).toEqual([]);
  });
});
