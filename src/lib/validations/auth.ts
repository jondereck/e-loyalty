import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters.");

const optionalUsername = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value || undefined)
  .refine((value) => !value || value.length >= 3, "Username must be at least 3 characters.")
  .refine((value) => !value || value.length <= 20, "Username must be 20 characters or fewer.")
  .refine((value) => !value || /^[a-z0-9_]+$/.test(value), "Use lowercase letters, numbers, and underscores only.");

const optionalMobile = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .refine((value) => !value || value.length >= 7, "Mobile must be at least 7 characters.");

export const signupSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required.").trim(),
    email: z.email("Enter a valid email.").trim().toLowerCase(),
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  identifier: z.string().min(3, "Email, mobile, or username is required.").trim(),
  password: z.string().min(1, "Password is required."),
  rememberMe: z.coerce.boolean().optional(),
});

export const completeProfileSchema = z.object({
  fullName: z.string().min(2, "Full name is required.").trim(),
});

export const profileSettingsSchema = z.object({
  fullName: z.string().min(2, "Full name is required.").trim(),
  username: optionalUsername,
  mobile: optionalMobile,
});

export type AuthActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

