import { z } from "zod";

const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .regex(/[A-Za-z]/, "Password must include a letter.")
  .regex(/[0-9]/, "Password must include a number.");

export const signupSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required.").trim(),
    username: z.string().min(3, "Username must be at least 3 characters.").regex(/^[a-zA-Z0-9_]+$/, "Use letters, numbers, and underscores only.").trim(),
    mobile: z.string().min(7, "Mobile is required.").trim(),
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
});

export type AuthActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

