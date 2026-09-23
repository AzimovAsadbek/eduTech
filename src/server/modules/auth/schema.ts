import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Email notoʻgʻri").max(200),
  password: z.string().min(8, "Kamida 8 ta belgi").max(200),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const roleSchema = z.enum(["SUPER_ADMIN", "ADMIN", "EDITOR"]);

export const adminUserCreateSchema = z.object({
  email: z.string().trim().email().max(200),
  name: z.string().trim().min(2).max(100),
  password: z
    .string()
    .min(10, "Kamida 10 ta belgi")
    .max(200)
    .regex(/[A-Z]/, "Kamida bitta katta harf")
    .regex(/[0-9]/, "Kamida bitta raqam"),
  role: roleSchema.default("EDITOR"),
});
export type AdminUserCreateInput = z.infer<typeof adminUserCreateSchema>;

export const adminUserUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  role: roleSchema.optional(),
  isActive: z.boolean().optional(),
  password: adminUserCreateSchema.shape.password.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: adminUserCreateSchema.shape.password,
});
