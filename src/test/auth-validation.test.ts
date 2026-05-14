import { describe, expect, it } from "vitest";
import type { AppRole } from "@/generated/prisma/client";
import { canLinkProfileByEmail, isProfileComplete } from "@/lib/auth/profile-resolution";
import { resolvePublicProfileRoles } from "@/lib/public-profile";
import { completeProfileSchema, forcedPasswordChangeSchema, profileSettingsSchema, signupSchema } from "@/lib/validations/auth";

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

describe("profile validation", () => {
  it("allows complete profile with full name only", () => {
    const result = completeProfileSchema.safeParse({ fullName: "Juan Dela Cruz" });

    expect(result.success).toBe(true);
  });

  it("allows blank optional username and mobile in account settings", () => {
    const result = profileSettingsSchema.safeParse({
      fullName: "Juan Dela Cruz",
      username: "",
      mobile: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.username).toBeUndefined();
      expect(result.data.mobile).toBeUndefined();
    }
  });

  it("defaults new public profiles to the customer role", () => {
    expect(resolvePublicProfileRoles()).toEqual(["CUSTOMER"]);
    expect(resolvePublicProfileRoles([])).toEqual(["CUSTOMER"]);
  });

  it("preserves existing privileged or custom roles during public profile completion", () => {
    expect(resolvePublicProfileRoles(["SUPER_ADMIN"])).toEqual(["SUPER_ADMIN"]);
    expect(resolvePublicProfileRoles(["BRANCH_ADMIN", "CUSTOMER"])).toEqual(["BRANCH_ADMIN", "CUSTOMER"]);
    expect(resolvePublicProfileRoles(["CASHIER"])).toEqual(["CASHIER"]);
  });

  it("treats only full name, email, and role as required profile fields", () => {
    expect(isProfileComplete({
      fullName: "Juan Dela Cruz",
      email: "juan@example.com",
      roles: ["CUSTOMER"] as AppRole[],
    })).toBe(true);

    expect(isProfileComplete({
      fullName: "",
      email: "juan@example.com",
      roles: ["CUSTOMER"] as AppRole[],
    })).toBe(false);
  });

  it("only allows email fallback linking for verified or trusted-provider sessions", () => {
    expect(canLinkProfileByEmail({ email: "juan@example.com", emailVerified: true, trustedProvider: false })).toBe(true);
    expect(canLinkProfileByEmail({ email: "juan@example.com", emailVerified: false, trustedProvider: true })).toBe(true);
    expect(canLinkProfileByEmail({ email: "juan@example.com", emailVerified: false, trustedProvider: false })).toBe(false);
    expect(canLinkProfileByEmail({ email: undefined, emailVerified: true, trustedProvider: true })).toBe(false);
  });
});

describe("forced password change validation", () => {
  it("requires matching new passwords", () => {
    const result = forcedPasswordChangeSchema.safeParse({
      currentPassword: "TempPass123!",
      newPassword: "NewPass123!",
      confirmPassword: "WrongPass123!",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain("Passwords do not match.");
    }
  });

  it("accepts a valid forced password change payload", () => {
    expect(forcedPasswordChangeSchema.safeParse({
      currentPassword: "TempPass123!",
      newPassword: "NewPass123!",
      confirmPassword: "NewPass123!",
    }).success).toBe(true);
  });
});
