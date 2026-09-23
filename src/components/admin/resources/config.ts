/**
 * Client-safe UI description of every CMS resource.
 * Keys mirror `src/server/modules/content/registry.ts`; never import that file here.
 */
import type { z } from "zod";
import {
  branchSchema,
  courseCategorySchema,
  courseSchema,
  faqSchema,
  galleryItemSchema,
  mediaProjectSchema,
  resultSchema,
  serviceSchema,
  teacherSchema,
  testimonialSchema,
} from "@/server/modules/content/schema";

export const RESOURCE_KEYS = ["courses", "course-categories", "teachers", "services", "media-projects", "testimonials", "results", "gallery", "faq", "branches"] as const;
export type ResourceKey = (typeof RESOURCE_KEYS)[number];

export type RelationKey = "course-categories" | "courses" | "services";

export interface Option {
  value: string;
  label: string;
}

interface BaseField {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  /** Grid span inside a two-column section. */
  span?: 1 | 2;
}

export type JsonShape = "curriculum" | "projects" | "process" | "videos";

export type FieldDef =
  | (BaseField & { type: "text"; placeholder?: string; maxLength?: number })
  | (BaseField & { type: "slug"; from: string })
  | (BaseField & { type: "textarea"; rows?: number; maxLength?: number })
  | (BaseField & { type: "number"; min?: number; max?: number })
  | (BaseField & { type: "select"; options: Option[]; nullable?: boolean })
  | (BaseField & { type: "relation"; resource: RelationKey })
  | (BaseField & { type: "multiselect"; resource: "teachers" })
  | (BaseField & { type: "boolean" })
  | (BaseField & { type: "color" })
  | (BaseField & { type: "image" })
  | (BaseField & { type: "string-list"; placeholder?: string })
  | (BaseField & { type: "json-list"; shape: JsonShape })
  | (BaseField & { type: "socials" });

export type ColumnKind = "text" | "mono" | "date" | "status" | "image" | "boolean" | "number" | "relation";

export interface ColumnDef {
  key: string;
  label: string;
  kind?: ColumnKind;
  /** Tailwind width class for the header cell. */
  width?: string;
  /** Secondary line under the primary text (dotted path). */
  sub?: string;
  hideBelow?: "md" | "lg";
}

export interface Section {
  title: string;
  description?: string;
  fields: FieldDef[];
}

export interface ResourceUi {
  key: ResourceKey;
  label: string;
  singular: string;
  /** Field used for the page title while editing. */
  titleField: string;
  hasStatus: boolean;
  /** Extra boolean shown in the publish panel (e.g. featured / isActive). */
  panelToggle?: { name: string; label: string; hint?: string };
  schema: z.ZodType;
  columns: ColumnDef[];
  sections: Section[];
  preview?: (item: Record<string, unknown>) => string | null;
}

const LEVELS: Option[] = [
  { value: "BEGINNER", label: "Boshlangʻich" },
  { value: "INTERMEDIATE", label: "Oʻrta" },
  { value: "ADVANCED", label: "Yuqori" },
];
const FORMATS: Option[] = [
  { value: "OFFLINE", label: "Offlayn" },
  { value: "ONLINE", label: "Onlayn" },
  { value: "HYBRID", label: "Gibrid" },
];
const RESULT_KINDS: Option[] = [
  { value: "PROJECT", label: "Loyiha" },
  { value: "CAREER", label: "Karyera" },
  { value: "GROWTH", label: "Oʻsish" },
  { value: "CERTIFICATE", label: "Sertifikat" },
];
const GALLERY_CATS: Option[] = [
  { value: "CLASSROOM", label: "Dars xonasi" },
  { value: "EVENT", label: "Tadbir" },
  { value: "PRODUCTION", label: "Prodakshn" },
  { value: "CAMPUS", label: "Kampus" },
];
const FAQ_SCOPES: Option[] = [
  { value: "GENERAL", label: "Umumiy" },
  { value: "EDU", label: "Taʼlim" },
  { value: "MEDIA", label: "Media" },
];

const seoSection: Section = {
  title: "SEO",
  description: "Boʻsh qoldirilsa sarlavha va tagline ishlatiladi.",
  fields: [
    { type: "text", name: "seoTitle", label: "SEO sarlavha", maxLength: 70 },
    { type: "textarea", name: "seoDescription", label: "SEO tavsif", maxLength: 170, rows: 2 },
  ],
};

export const RESOURCES: Record<ResourceKey, ResourceUi> = {
  courses: {
    key: "courses",
    label: "Kurslar",
    singular: "Kurs",
    titleField: "title",
    hasStatus: true,
    panelToggle: { name: "featured", label: "Tavsiya etilgan", hint: "Bosh sahifada ajratib koʻrsatiladi" },
    schema: courseSchema,
    preview: (i) => (typeof i.slug === "string" ? `/kurslar/${i.slug}?preview=1` : null),
    columns: [
      { key: "coverImage", label: "", kind: "image", width: "w-14" },
      { key: "title", label: "Kurs", sub: "roleLabel" },
      { key: "category.name", label: "Yoʻnalish", kind: "relation", hideBelow: "md" },
      { key: "durationLabel", label: "Davomiylik", hideBelow: "lg" },
      { key: "status", label: "Holat", kind: "status", width: "w-32" },
      { key: "updatedAt", label: "Yangilangan", kind: "date", width: "w-36", hideBelow: "lg" },
    ],
    sections: [
      {
        title: "Asosiy",
        fields: [
          { type: "text", name: "title", label: "Nomi", required: true, maxLength: 120 },
          { type: "slug", name: "slug", label: "Slug", from: "title", required: true, hint: "URL manzil: /kurslar/slug" },
          { type: "text", name: "roleLabel", label: "Kasb nomi", required: true, hint: "Masalan: Frontend Developer", maxLength: 80 },
          { type: "relation", name: "categoryId", label: "Yoʻnalish", resource: "course-categories" },
          { type: "text", name: "tagline", label: "Tagline", required: true, span: 2, maxLength: 160 },
          { type: "textarea", name: "description", label: "Tavsif", required: true, span: 2, rows: 6, maxLength: 4000 },
          { type: "image", name: "coverImage", label: "Muqova rasmi", span: 2 },
          { type: "color", name: "accent", label: "Aksent rangi", hint: "Kurs sahifasi uchun ambient rang" },
          { type: "multiselect", name: "teacherIds", label: "Oʻqituvchilar", resource: "teachers" },
        ],
      },
      {
        title: "Format va narx",
        fields: [
          { type: "select", name: "level", label: "Daraja", options: LEVELS },
          { type: "select", name: "format", label: "Format", options: FORMATS },
          { type: "text", name: "durationLabel", label: "Davomiylik", required: true, placeholder: "6 oy" },
          { type: "number", name: "durationWeeks", label: "Hafta soni", min: 1 },
          { type: "text", name: "schedule", label: "Jadval", placeholder: "Haftasiga 3 kun · 90 daqiqa" },
          { type: "text", name: "priceLabel", label: "Narx", placeholder: "1 200 000 soʻm / oy" },
          { type: "text", name: "ageLabel", label: "Yosh", placeholder: "14+" },
        ],
      },
      {
        title: "Dastur",
        fields: [
          { type: "string-list", name: "whoFor", label: "Kimlar uchun", span: 2 },
          { type: "string-list", name: "skills", label: "Koʻnikmalar", span: 2 },
          { type: "string-list", name: "outcomes", label: "Natijalar", span: 2 },
          { type: "json-list", name: "curriculum", label: "Oʻquv dasturi", shape: "curriculum", span: 2 },
          { type: "json-list", name: "projects", label: "Loyihalar", shape: "projects", span: 2 },
        ],
      },
      seoSection,
    ],
  },
  "course-categories": {
    key: "course-categories",
    label: "Kurs yoʻnalishlari",
    singular: "Yoʻnalish",
    titleField: "name",
    hasStatus: false,
    schema: courseCategorySchema,
    columns: [
      { key: "name", label: "Nomi" },
      { key: "slug", label: "Slug", kind: "mono", hideBelow: "md" },
      { key: "order", label: "Tartib", kind: "number", width: "w-20" },
    ],
    sections: [
      {
        title: "Asosiy",
        fields: [
          { type: "text", name: "name", label: "Nomi", required: true, maxLength: 80 },
          { type: "slug", name: "slug", label: "Slug", from: "name", required: true },
        ],
      },
    ],
  },
  teachers: {
    key: "teachers",
    label: "Oʻqituvchilar",
    singular: "Oʻqituvchi",
    titleField: "name",
    hasStatus: true,
    schema: teacherSchema,
    columns: [
      { key: "photo", label: "", kind: "image", width: "w-14" },
      { key: "name", label: "Ism", sub: "title" },
      { key: "status", label: "Holat", kind: "status", width: "w-32" },
      { key: "updatedAt", label: "Yangilangan", kind: "date", width: "w-36", hideBelow: "lg" },
    ],
    sections: [
      {
        title: "Asosiy",
        fields: [
          { type: "text", name: "name", label: "Ism familiya", required: true, maxLength: 100 },
          { type: "slug", name: "slug", label: "Slug", from: "name", required: true },
          { type: "text", name: "title", label: "Lavozim", required: true, span: 2, placeholder: "Senior Frontend Engineer", maxLength: 120 },
          { type: "textarea", name: "bio", label: "Bio", span: 2, rows: 5, maxLength: 2000 },
          { type: "image", name: "photo", label: "Foto", span: 2 },
          { type: "socials", name: "socials", label: "Ijtimoiy tarmoqlar", span: 2 },
        ],
      },
    ],
  },
  services: {
    key: "services",
    label: "Media xizmatlar",
    singular: "Xizmat",
    titleField: "title",
    hasStatus: true,
    panelToggle: { name: "featured", label: "Tavsiya etilgan" },
    schema: serviceSchema,
    preview: (i) => (typeof i.slug === "string" ? `/media/xizmatlar/${i.slug}?preview=1` : null),
    columns: [
      { key: "coverImage", label: "", kind: "image", width: "w-14" },
      { key: "title", label: "Xizmat", sub: "tagline" },
      { key: "status", label: "Holat", kind: "status", width: "w-32" },
      { key: "updatedAt", label: "Yangilangan", kind: "date", width: "w-36", hideBelow: "lg" },
    ],
    sections: [
      {
        title: "Asosiy",
        fields: [
          { type: "text", name: "title", label: "Nomi", required: true, maxLength: 120 },
          { type: "slug", name: "slug", label: "Slug", from: "title", required: true, hint: "URL: /media/xizmatlar/slug" },
          { type: "text", name: "tagline", label: "Tagline", required: true, span: 2, maxLength: 160 },
          { type: "textarea", name: "description", label: "Tavsif", required: true, span: 2, rows: 6, maxLength: 4000 },
          { type: "image", name: "coverImage", label: "Muqova rasmi", span: 2 },
        ],
      },
      {
        title: "Tafsilotlar",
        fields: [
          { type: "string-list", name: "attributes", label: "Xususiyatlar", span: 2, placeholder: "Creative, Fast, Vertical…" },
          { type: "string-list", name: "deliverables", label: "Natijalar (deliverables)", span: 2 },
          { type: "json-list", name: "process", label: "Ish jarayoni", shape: "process", span: 2 },
        ],
      },
      seoSection,
    ],
  },
  "media-projects": {
    key: "media-projects",
    label: "Media loyihalar",
    singular: "Loyiha",
    titleField: "title",
    hasStatus: true,
    panelToggle: { name: "featured", label: "Tavsiya etilgan" },
    schema: mediaProjectSchema,
    preview: (i) => (typeof i.slug === "string" ? `/media/portfolio/${i.slug}?preview=1` : null),
    columns: [
      { key: "coverImage", label: "", kind: "image", width: "w-14" },
      { key: "title", label: "Loyiha", sub: "client" },
      { key: "category", label: "Kategoriya", hideBelow: "md" },
      { key: "service.title", label: "Xizmat", kind: "relation", hideBelow: "lg" },
      { key: "status", label: "Holat", kind: "status", width: "w-32" },
      { key: "updatedAt", label: "Yangilangan", kind: "date", width: "w-36", hideBelow: "lg" },
    ],
    sections: [
      {
        title: "Asosiy",
        fields: [
          { type: "text", name: "title", label: "Nomi", required: true, maxLength: 160 },
          { type: "slug", name: "slug", label: "Slug", from: "title", required: true, hint: "URL: /media/portfolio/slug" },
          { type: "text", name: "client", label: "Mijoz", required: true, maxLength: 120 },
          { type: "text", name: "category", label: "Kategoriya", required: true, placeholder: "Reklama roligi", maxLength: 60 },
          { type: "relation", name: "serviceId", label: "Xizmat", resource: "services" },
          { type: "string-list", name: "tags", label: "Teglar" },
          { type: "textarea", name: "description", label: "Tavsif", required: true, span: 2, rows: 5, maxLength: 4000 },
        ],
      },
      {
        title: "Keys",
        fields: [
          { type: "textarea", name: "challenge", label: "Muammo", rows: 4, maxLength: 3000 },
          { type: "textarea", name: "solution", label: "Yechim", rows: 4, maxLength: 3000 },
          { type: "textarea", name: "results", label: "Natija", span: 2, rows: 4, maxLength: 3000 },
        ],
      },
      {
        title: "Media",
        fields: [
          { type: "image", name: "coverImage", label: "Muqova", span: 2 },
          { type: "image", name: "beforeImage", label: "Oldin" },
          { type: "image", name: "afterImage", label: "Keyin" },
          { type: "string-list", name: "images", label: "Rasmlar (URL)", span: 2, placeholder: "/uploads/2026/09/…webp" },
          { type: "json-list", name: "videos", label: "Videolar", shape: "videos", span: 2 },
        ],
      },
    ],
  },
  testimonials: {
    key: "testimonials",
    label: "Fikrlar",
    singular: "Fikr",
    titleField: "name",
    hasStatus: true,
    schema: testimonialSchema,
    columns: [
      { key: "photo", label: "", kind: "image", width: "w-14" },
      { key: "name", label: "Ism", sub: "role" },
      { key: "course.title", label: "Kurs", kind: "relation", hideBelow: "md" },
      { key: "status", label: "Holat", kind: "status", width: "w-32" },
      { key: "updatedAt", label: "Yangilangan", kind: "date", width: "w-36", hideBelow: "lg" },
    ],
    sections: [
      {
        title: "Asosiy",
        fields: [
          { type: "text", name: "name", label: "Ism", required: true, maxLength: 100 },
          { type: "text", name: "role", label: "Rol / lavozim", placeholder: "Frontend kursi bitiruvchisi", maxLength: 160 },
          { type: "relation", name: "courseId", label: "Kurs", resource: "courses" },
          { type: "text", name: "resultLabel", label: "Natija", placeholder: "Junior Frontend Developer sifatida ishga kirdi", maxLength: 160 },
          { type: "textarea", name: "quote", label: "Fikr", required: true, span: 2, rows: 4, maxLength: 1200 },
          { type: "image", name: "photo", label: "Foto" },
          { type: "text", name: "videoUrl", label: "Video URL", placeholder: "https://youtube.com/…" },
        ],
      },
    ],
  },
  results: {
    key: "results",
    label: "Natijalar",
    singular: "Natija",
    titleField: "title",
    hasStatus: true,
    panelToggle: { name: "featured", label: "Tavsiya etilgan" },
    schema: resultSchema,
    columns: [
      { key: "image", label: "", kind: "image", width: "w-14" },
      { key: "title", label: "Natija", sub: "studentName" },
      { key: "kind", label: "Turi", kind: "mono", hideBelow: "md" },
      { key: "course.title", label: "Kurs", kind: "relation", hideBelow: "lg" },
      { key: "status", label: "Holat", kind: "status", width: "w-32" },
    ],
    sections: [
      {
        title: "Asosiy",
        fields: [
          { type: "text", name: "title", label: "Sarlavha", required: true, maxLength: 160 },
          { type: "select", name: "kind", label: "Turi", options: RESULT_KINDS },
          { type: "text", name: "studentName", label: "Talaba", maxLength: 100 },
          { type: "relation", name: "courseId", label: "Kurs", resource: "courses" },
          { type: "text", name: "metricLabel", label: "Koʻrsatkich", placeholder: "+40 000 obunachi", maxLength: 80 },
          { type: "text", name: "link", label: "Havola", placeholder: "https://…" },
          { type: "textarea", name: "description", label: "Tavsif", span: 2, rows: 4, maxLength: 2000 },
        ],
      },
      {
        title: "Rasmlar",
        fields: [
          { type: "image", name: "image", label: "Asosiy rasm", span: 2 },
          { type: "image", name: "beforeImage", label: "Oldin" },
          { type: "image", name: "afterImage", label: "Keyin" },
        ],
      },
    ],
  },
  gallery: {
    key: "gallery",
    label: "Galereya",
    singular: "Rasm",
    titleField: "alt",
    hasStatus: true,
    schema: galleryItemSchema,
    columns: [
      { key: "image", label: "", kind: "image", width: "w-14" },
      { key: "alt", label: "Alt matn", sub: "title" },
      { key: "category", label: "Kategoriya", kind: "mono", hideBelow: "md" },
      { key: "status", label: "Holat", kind: "status", width: "w-32" },
    ],
    sections: [
      {
        title: "Asosiy",
        fields: [
          { type: "image", name: "image", label: "Rasm", required: true, span: 2 },
          { type: "text", name: "alt", label: "Alt matn", required: true, maxLength: 200 },
          { type: "text", name: "title", label: "Sarlavha", maxLength: 160 },
          { type: "select", name: "category", label: "Kategoriya", options: GALLERY_CATS },
        ],
      },
    ],
  },
  faq: {
    key: "faq",
    label: "FAQ",
    singular: "Savol",
    titleField: "question",
    hasStatus: true,
    schema: faqSchema,
    columns: [
      { key: "question", label: "Savol" },
      { key: "scope", label: "Boʻlim", kind: "mono", width: "w-24" },
      { key: "course.title", label: "Kurs", kind: "relation", hideBelow: "md" },
      { key: "status", label: "Holat", kind: "status", width: "w-32" },
    ],
    sections: [
      {
        title: "Asosiy",
        fields: [
          { type: "text", name: "question", label: "Savol", required: true, span: 2, maxLength: 300 },
          { type: "textarea", name: "answer", label: "Javob", required: true, span: 2, rows: 5, maxLength: 3000 },
          { type: "select", name: "scope", label: "Boʻlim", options: FAQ_SCOPES },
          { type: "relation", name: "courseId", label: "Kurs (ixtiyoriy)", resource: "courses" },
        ],
      },
    ],
  },
  branches: {
    key: "branches",
    label: "Filiallar",
    singular: "Filial",
    titleField: "name",
    hasStatus: false,
    panelToggle: { name: "isActive", label: "Faol", hint: "Nofaol filiallar saytda koʻrinmaydi" },
    schema: branchSchema,
    columns: [
      { key: "name", label: "Filial", sub: "address" },
      { key: "phone", label: "Telefon", kind: "mono", hideBelow: "md" },
      { key: "isActive", label: "Faol", kind: "boolean", width: "w-20" },
      { key: "order", label: "Tartib", kind: "number", width: "w-20" },
    ],
    sections: [
      {
        title: "Asosiy",
        fields: [
          { type: "text", name: "name", label: "Nomi", required: true, maxLength: 100 },
          { type: "text", name: "phone", label: "Telefon", placeholder: "+998 ..", maxLength: 30 },
          { type: "text", name: "address", label: "Manzil", required: true, span: 2, maxLength: 300 },
          { type: "text", name: "workingHours", label: "Ish vaqti", placeholder: "Du–Sh 09:00–19:00", maxLength: 120 },
          { type: "text", name: "mapUrl", label: "Xarita havolasi", placeholder: "https://maps.google.com/…" },
        ],
      },
    ],
  },
};

export function isResourceKey(key: string): key is ResourceKey {
  return (RESOURCE_KEYS as readonly string[]).includes(key);
}

export function relationKeysOf(ui: ResourceUi): RelationKey[] {
  const keys = new Set<RelationKey>();
  for (const s of ui.sections) for (const f of s.fields) if (f.type === "relation") keys.add(f.resource);
  return [...keys];
}

/** Label for a relation option (which field to display). */
export const RELATION_LABEL_FIELD: Record<RelationKey, string> = {
  "course-categories": "name",
  courses: "title",
  services: "title",
};

/** Safe dotted-path getter for list cells. */
export function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[k] : undefined), obj);
}
