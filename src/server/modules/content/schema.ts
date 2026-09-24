import { z } from "zod";

export const contentStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);
const slug = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug faqat kichik harf, raqam va chiziqchadan iborat boʻlsin");
const text = (max: number) => z.string().trim().max(max);
const optText = (max: number) => z.string().trim().max(max).nullable().optional();
const strList = z.array(z.string().trim().min(1).max(300)).max(50).default([]);
const url = z.string().trim().max(500).nullable().optional();
/**
 * Public pages render CMS images through `next/image`, which has no remote hosts configured —
 * an external URL would 500 the page. Images must therefore be site-local paths (uploads from the library).
 */
export const IMAGE_PATH_MESSAGE = "Rasm manzili sayt ichidagi yoʻl boʻlishi kerak (masalan /uploads/…)";
const imagePath = z.string().trim().max(500).regex(/^\/(?!\/)\S*$/, IMAGE_PATH_MESSAGE);
const optImagePath = imagePath.nullable().optional();
const imageList = z.array(imagePath).max(50).default([]);

export const curriculumSchema = z.array(z.object({ title: text(200), lessons: z.array(text(300)).max(40) })).max(30);
export const projectsSchema = z.array(z.object({ title: text(200), description: text(600).optional() })).max(20);
export const processSchema = z.array(z.object({ step: text(10), title: text(200), description: text(600) })).max(12);
export const videosSchema = z.array(z.object({ url: text(500), title: text(200).optional(), poster: imagePath.optional() })).max(20);
export const socialsSchema = z.object({ telegram: text(200).optional(), instagram: text(200).optional(), linkedin: text(200).optional() });

const base = { status: contentStatusSchema.default("DRAFT"), order: z.coerce.number().int().min(0).default(0) };

export const courseSchema = z.object({
  slug,
  title: text(120).min(2),
  roleLabel: text(80).min(2),
  tagline: text(160).min(2),
  description: text(4000).min(10),
  categoryId: z.string().nullable().optional(),
  level: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED"]).default("BEGINNER"),
  format: z.enum(["OFFLINE", "ONLINE", "HYBRID"]).default("OFFLINE"),
  durationLabel: text(60).min(1),
  durationWeeks: z.coerce.number().int().positive().nullable().optional(),
  schedule: optText(160),
  priceLabel: optText(80),
  ageLabel: optText(30),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  coverImage: optImagePath,
  whoFor: strList,
  skills: strList,
  outcomes: strList,
  curriculum: curriculumSchema.nullable().optional(),
  projects: projectsSchema.nullable().optional(),
  featured: z.boolean().default(false),
  seoTitle: optText(70),
  seoDescription: optText(170),
  teacherIds: z.array(z.string()).max(20).optional(),
  ...base,
});

export const courseCategorySchema = z.object({ slug, name: text(80).min(2), order: z.coerce.number().int().min(0).default(0) });

export const teacherSchema = z.object({
  slug,
  name: text(100).min(2),
  title: text(120).min(2),
  bio: optText(2000),
  photo: optImagePath,
  socials: socialsSchema.nullable().optional(),
  ...base,
});

export const serviceSchema = z.object({
  slug,
  title: text(120).min(2),
  tagline: text(160).min(2),
  description: text(4000).min(10),
  attributes: strList,
  deliverables: strList,
  process: processSchema.nullable().optional(),
  coverImage: optImagePath,
  featured: z.boolean().default(false),
  seoTitle: optText(70),
  seoDescription: optText(170),
  ...base,
});

export const mediaProjectSchema = z.object({
  slug,
  title: text(160).min(2),
  client: text(120).min(1),
  serviceId: z.string().nullable().optional(),
  category: text(60).min(1),
  description: text(4000).min(10),
  challenge: optText(3000),
  solution: optText(3000),
  results: optText(3000),
  coverImage: optImagePath,
  videos: videosSchema.nullable().optional(),
  images: imageList,
  tags: strList,
  beforeImage: optImagePath,
  afterImage: optImagePath,
  featured: z.boolean().default(false),
  ...base,
});

export const testimonialSchema = z.object({
  name: text(100).min(2),
  role: optText(160),
  courseId: z.string().nullable().optional(),
  photo: optImagePath,
  quote: text(1200).min(5),
  resultLabel: optText(160),
  videoUrl: url,
  ...base,
});

export const resultSchema = z.object({
  kind: z.enum(["PROJECT", "CAREER", "GROWTH", "CERTIFICATE"]).default("PROJECT"),
  title: text(160).min(2),
  studentName: optText(100),
  courseId: z.string().nullable().optional(),
  description: optText(2000),
  metricLabel: optText(80),
  image: optImagePath,
  beforeImage: optImagePath,
  afterImage: optImagePath,
  link: url,
  featured: z.boolean().default(false),
  ...base,
});

export const galleryItemSchema = z.object({
  title: optText(160),
  image: imagePath.min(1),
  alt: text(200).min(2),
  category: z.enum(["CLASSROOM", "EVENT", "PRODUCTION", "CAMPUS"]).default("CLASSROOM"),
  ...base,
});

export const faqSchema = z.object({
  question: text(300).min(5),
  answer: text(3000).min(5),
  scope: z.enum(["GENERAL", "EDU", "MEDIA"]).default("GENERAL"),
  courseId: z.string().nullable().optional(),
  ...base,
});

export const branchSchema = z.object({
  name: text(100).min(2),
  address: text(300).min(2),
  phone: optText(30),
  mapUrl: url,
  workingHours: optText(120),
  isActive: z.boolean().default(true),
  order: z.coerce.number().int().min(0).default(0),
});

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().trim().max(100).optional(),
  status: contentStatusSchema.optional(),
});
export type ListQuery = z.infer<typeof listQuerySchema>;
