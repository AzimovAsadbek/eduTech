import { revalidateTag } from "next/cache";

/** Cache tags shared between public loaders and admin mutations. */
export const CacheTags = {
  courses: "courses",
  services: "services",
  teachers: "teachers",
  results: "results",
  testimonials: "testimonials",
  mediaProjects: "media-projects",
  gallery: "gallery",
  faq: "faq",
  settings: "settings",
  branches: "branches",
} as const;

export type CacheTag = (typeof CacheTags)[keyof typeof CacheTags];

export function invalidate(...tags: CacheTag[]) {
  for (const tag of tags) revalidateTag(tag, "max");
}
