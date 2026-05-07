import { describe, expect, it } from "vitest";
import { signupSchema } from "@/lib/validations/auth";

describe("signup validation", () => {
  const validSignup = {
    fullName: "Juan Dela Cruz",
    email: "juan@example.com",
    password: "password",
    confirmPassword: "password",
  };

  it("accepts the simplified four-field signup shape", () => {
    const result = signupSchema.safeParse(validSignup);

    expect(result.success).toBe(true);
  });

  it("does not require username or mobile during signup", () => {
    const result = signupSchema.safeParse(validSignup);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("username");
      expect(result.data).not.toHaveProperty("mobile");
    }
  });

  it("requires password to be at least 8 characters only", () => {
    expect(signupSchema.safeParse({ ...validSignup, password: "1234567", confirmPassword: "1234567" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...validSignup, password: "12345678", confirmPassword: "12345678" }).success).toBe(true);
  });

  it("rejects mismatched password confirmation", () => {
    const result = signupSchema.safeParse({ ...validSignup, confirmPassword: "different" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain("Passwords do not match.");
    }
  });
});
