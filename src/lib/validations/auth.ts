import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters.");

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
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(20, "Username must be 20 characters or fewer.")
    .regex(/^[a-z0-9_]+$/, "Use lowercase letters, numbers, and underscores only.")
    .trim(),
  mobile: z.string().min(7, "Mobile is required.").trim(),
});

export type AuthActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

