export const siteConfig = {
  name: "EduTech",
  legalName: "EduTech — Zamonaviy kasblar akademiyasi",
  description:
    "EduTech — Namangandagi zamonaviy kasblar akademiyasi va media studiya. Dasturlash, AI, robototexnika, SMM, video prodakshn va boshqa kurslar. Bizneslar uchun kontent va marketing xizmatlari.",
  locale: "uz_UZ",
  city: "Namangan",
  keywords: ["EduTech", "Namangan", "IT kurslar", "dasturlash kurslari", "AI kurs", "robototexnika", "SMM", "video prodakshn", "media studiya Namangan"],
} as const;

export const nav = [
  { href: "/kurslar", label: "Kurslar" },
  { href: "/natijalar", label: "Natijalar" },
  { href: "/media", label: "Media" },
  { href: "/biz-haqimizda", label: "Biz haqimizda" },
  { href: "/kontakt", label: "Kontakt" },
] as const;

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
