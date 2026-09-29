export const siteConfig = {
  name: "EduTech",
  legalName: "EduTech — Zamonaviy kasblar akademiyasi",
  description: "Namangandagi zamonaviy kasblar akademiyasi: dasturlash, AI, robototexnika, IT-Kids, SMM, target, mobilografiya va videografiya boʻyicha amaliy kurslar.",
  locale: "uz_UZ",
  city: "Namangan",
  keywords: ["EduTech", "Namangan", "IT kurslar", "dasturlash kurslari", "AI kurs", "robototexnika kursi", "SMM kursi", "mobilografiya kursi", "oʻquv markazi Namangan"],
} as const;

/** Primary navigation. Labels live in `messages/<locale>/common.json` under `common.nav.<key>`. */
export const nav = [
  { href: "/kurslar", key: "courses" },
  { href: "/natijalar", key: "results" },
  { href: "/media", key: "media" },
  { href: "/biz-haqimizda", key: "about" },
  { href: "/kontakt", key: "contact" },
] as const;

export type NavKey = (typeof nav)[number]["key"];

export const routes = {
  home: "/",
  courses: "/kurslar",
  course: (slug: string) => `/kurslar/${slug}`,
  results: "/natijalar",
  media: "/media",
  service: (slug: string) => `/media/xizmatlar/${slug}`,
  portfolio: "/media/portfolio",
  project: (slug: string) => `/media/portfolio/${slug}`,
  about: "/biz-haqimizda",
  contact: "/kontakt",
  apply: "/ariza",
} as const;

export function absoluteUrl(path = "/") {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return new URL(path, base).toString();
}
