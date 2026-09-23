import { z } from "zod";

const phone = z
  .string()
  .trim()
  .min(7, "Telefon raqam notoʻgʻri")
  .max(20)
  .regex(/^[+\d\s()-]+$/, "Telefon raqam faqat raqamlardan iborat boʻlishi kerak");

const shortText = (max: number) => z.string().trim().max(max);

/** Anti-spam fields shared by all public forms. */
const antiSpam = {
  website: z.string().max(0, "Spam").optional(), // honeypot — must stay empty
  startedAt: z.coerce.number().optional(), // epoch ms when the form was rendered
};

export const educationLeadSchema = z.object({
  type: z.literal("EDUCATION"),
  name: shortText(100).min(2, "Ismingizni kiriting"),
  phone,
  courseId: z.string().min(1).optional(),
  courseSlug: z.string().min(1).optional(),
  branchId: z.string().optional(),
  message: shortText(1000).optional(),
  source: shortText(300).optional(),
  utm: z.record(z.string(), z.string().max(200)).optional(),
  ...antiSpam,
});

export const mediaLeadSchema = z.object({
  type: z.literal("MEDIA"),
  name: shortText(100).min(2, "Ismingizni kiriting"),
  phone,
  company: shortText(150).optional(),
  serviceId: z.string().min(1).optional(),
  serviceSlug: z.string().min(1).optional(),
  budget: shortText(100).optional(),
  message: shortText(1500).optional(),
  email: z.string().trim().email("Email notoʻgʻri").max(200).optional().or(z.literal("")),
  source: shortText(300).optional(),
  utm: z.record(z.string(), z.string().max(200)).optional(),
  ...antiSpam,
});

export const generalLeadSchema = z.object({
  type: z.literal("GENERAL"),
  name: shortText(100).min(2, "Ismingizni kiriting"),
  phone,
  interest: shortText(150).optional(),
  message: shortText(1500).optional(),
  email: z.string().trim().email("Email notoʻgʻri").max(200).optional().or(z.literal("")),
  source: shortText(300).optional(),
  utm: z.record(z.string(), z.string().max(200)).optional(),
  ...antiSpam,
});

export const publicLeadSchema = z.discriminatedUnion("type", [educationLeadSchema, mediaLeadSchema, generalLeadSchema]);
export type PublicLeadInput = z.infer<typeof publicLeadSchema>;

export const leadStatusSchema = z.enum(["NEW", "CONTACTED", "IN_PROGRESS", "CONVERTED", "LOST"]);
export const leadTypeSchema = z.enum(["EDUCATION", "MEDIA", "GENERAL"]);

export const leadFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().trim().max(100).optional(),
  type: leadTypeSchema.optional(),
  status: leadStatusSchema.optional(),
  courseId: z.string().optional(),
  serviceId: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  sort: z.enum(["createdAt", "updatedAt", "name", "status"]).default("createdAt"),
  dir: z.enum(["asc", "desc"]).default("desc"),
});
export type LeadFilter = z.infer<typeof leadFilterSchema>;

export const leadUpdateSchema = z.object({
  status: leadStatusSchema.optional(),
  assignedToId: z.string().nullable().optional(),
  name: shortText(100).min(2).optional(),
  phone: phone.optional(),
  email: z.string().trim().email().max(200).nullable().optional(),
  company: shortText(150).nullable().optional(),
  budget: shortText(100).nullable().optional(),
  message: shortText(1500).nullable().optional(),
  courseId: z.string().nullable().optional(),
  serviceId: z.string().nullable().optional(),
  branchId: z.string().nullable().optional(),
});

export const leadNoteSchema = z.object({ text: shortText(2000).min(1) });
