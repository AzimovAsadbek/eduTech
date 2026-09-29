import { z } from "zod";

const str = (max: number) => z.string().trim().max(max).optional();

/** One marketing touch as captured in the browser at landing time. */
export const touchSchema = z.object({
  utmSource: str(120),
  utmMedium: str(120),
  utmCampaign: str(160),
  utmContent: str(160),
  utmTerm: str(160),
  referrer: str(500),
  landingPath: str(300),
  fbclid: str(500),
  inApp: z.enum(["instagram", "facebook", "telegram"]).optional(),
  at: z.number().int().positive().optional(),
});
export type Touch = z.infer<typeof touchSchema>;

/** Sent with every public lead: first touch (30-day window), last touch (this session), click cookies. */
export const attributionInputSchema = z.object({
  sessionId: z.string().trim().min(8).max(64).optional(),
  first: touchSchema.optional(),
  last: touchSchema.optional(),
  /** Path of the page the form was submitted on. */
  page: str(300),
  fbc: str(500),
  fbp: str(200),
});
export type AttributionInput = z.infer<typeof attributionInputSchema>;

export const visitInputSchema = z.object({
  sessionId: z.string().trim().min(8).max(64),
  touch: touchSchema,
  locale: z.enum(["uz", "ru", "en"]).optional(),
});
export type VisitInput = z.infer<typeof visitInputSchema>;
