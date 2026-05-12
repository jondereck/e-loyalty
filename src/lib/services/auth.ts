"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import { getExpiredAuthCookieOptions, getNeonAuthCookieNames, shouldUseSecureAuthCookies } from "@/lib/auth/cookies";
import { auth } from "@/lib/auth/server";
import { generateCardNumber, generateQrToken } from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import { canAccessDuringMaintenance, getMaintenanceSettings } from "@/lib/services/settings";
import { resolveLoginIdentifier } from "@/lib/services/login-identifier";
import { getAuthUser, redirectForRoles, requirePasswordResetProfile, requireProfile } from "@/lib/services/session";
import { completeProfileSchema, forcedPasswordChangeSchema, loginSchema, profileSettingsSchema, signupSchema, type AuthActionState } from "@/lib/validations/auth";

function firstError(errors: Record<string, string[] | undefined>) {
  return Object.values(errors).flat().find(Boolean) ?? "Please check the form.";
}

async function clearNeonAuthCookies() {
  const cookieStore = await cookies();
  const cookieOptions = getExpiredAuthCookieOptions({
    secure: shouldUseSecureAuthCookies(),
  });

  for (const name of getNeonAuthCookieNames(cookieStore.getAll())) {
    cookieStore.set(name, "", cookieOptions);
  }
}

function buildProfileConflictWhere(email: string, username?: string, mobile?: string) {
  return {
    OR: [
      { email },
      ...(username ? [{ username }] : []),
      ...(mobile ? [{ mobile }] : []),
    ],
  };
}

export async function signupAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const maintenance = await getMaintenanceSettings();
  if (!canAccessDuringMaintenance({ path: "/signup", roles: [], maintenanceEnabled: maintenance.maintenanceEnabled })) {
    return { message: maintenance.maintenanceMessage };
  }

  const parsed = signupSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { errors, message: firstError(errors) };
  }

  const data = parsed.data;
  const existing = await prisma.userProfile.findUnique({
    where: { email: data.email },
    select: { email: true },
  });

  if (existing) {
    return {
      message: "Email is already registered.",
      errors: {
        email: ["Email is already registered."],
      },
    };
  }

  const result = await auth.signUp.email({
    email: data.email,
    password: data.password,
    name: data.fullName,
  });

  if (result.error) return { message: result.error.message };

  const authUser = result.data as unknown as { user?: { id?: string } };
  const authUserId = authUser.user?.id;
  if (!authUserId) return { message: "Auth account was created, but no auth user id was returned." };

  await prisma.$transaction(async (tx) => {
    const profile = await tx.userProfile.create({
      data: {
        authUserId,
        fullName: data.fullName,
        email: data.email,
        roles: ["CUSTOMER"],
      },
    });

    await tx.auditEvent.create({
      data: {
        actorId: profile.id,
        action: "ACCOUNT_SIGNUP",
        metadata: { method: "password" },
      },
    });

    await tx.loyaltyCard.create({
      data: {
        profileId: profile.id,
        cardNumber: generateCardNumber(),
        qrToken: generateQrToken(),
      },
    });
  });

  redirect("/auth/finish");
}

export async function loginAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { errors, message: firstError(errors) };
  }

  const { profile, email } = await resolveLoginIdentifier(parsed.data.identifier);
  if (!email) return { message: "No account found for that identifier." };
  if (profile?.status && profile.status !== "ACTIVE") {
    return { message: "This account is not active. Contact an administrator." };
  }

  const result = await auth.signIn.email({
    email,
    password: parsed.data.password,
    rememberMe: parsed.data.rememberMe,
  });

  if (result.error) return { message: result.error.message };

  redirect("/auth/finish");
}

export async function logoutAction() {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Neon Auth sign-out failed; clearing local auth cookies.", error);
  }

  await clearNeonAuthCookies();
  redirect("/login", RedirectType.replace);
}

export async function finishAuthSession() {
  const user = await getAuthUser();
  if (!user?.id) redirect("/login");
  const authUserId = user.id;

  let profile = await prisma.userProfile.findUnique({
    where: { authUserId },
  });

  if (!profile && user.email) {
    const email = user.email.toLowerCase();
    const existingByEmail = await prisma.userProfile.findUnique({
      where: { email },
    });

    if (existingByEmail) {
      profile = await prisma.userProfile.update({
        where: { id: existingByEmail.id },
        data: { authUserId },
      });
    } else {
      profile = await prisma.$transaction(async (tx) => {
        const created = await tx.userProfile.create({
          data: {
            authUserId,
            fullName: user.name?.trim() || email.split("@")[0],
            email,
            roles: ["CUSTOMER"],
          },
        });

        await tx.loyaltyCard.create({
          data: {
            profileId: created.id,
            cardNumber: generateCardNumber(),
            qrToken: generateQrToken(),
          },
        });

        await tx.auditEvent.create({
          data: {
            actorId: created.id,
            action: "ACCOUNT_SIGNUP",
            metadata: { method: "external_auth" },
          },
        });

        return created;
      });
    }
  }

  if (!profile) redirect("/complete-profile");
  if (profile.status !== "ACTIVE") {
    await auth.signOut();
    redirect("/login?error=suspended");
  }

  await prisma.auditEvent.create({
    data: {
      actorId: profile.id,
      action: "ACCOUNT_LOGIN",
      metadata: { email: user.email },
    },
  });

  if (!canAccessDuringMaintenance({ path: redirectForRoles(profile.roles), roles: profile.roles, maintenanceEnabled: (await getMaintenanceSettings()).maintenanceEnabled })) {
    redirect("/maintenance");
  }

  if (profile.mustChangePassword) {
    redirect("/auth/force-password");
  }

  redirect(redirectForRoles(profile.roles));
}

export async function completeProfileAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const user = await getAuthUser();
  if (!user?.id || !user.email) return { message: "Your auth session expired. Please sign in again." };
  const authUserId = user.id;
  const email = user.email.toLowerCase();

  const existingProfile = await prisma.userProfile.findUnique({ where: { authUserId } });
  if (existingProfile) redirect(redirectForRoles(existingProfile.roles));

  const parsed = completeProfileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { errors, message: firstError(errors) };
  }

  const data = parsed.data;
  const existing = await prisma.userProfile.findFirst({
    where: buildProfileConflictWhere(email),
    select: { email: true },
  });

  if (existing) {
    return {
      message: "Email is already registered.",
    };
  }

  await prisma.$transaction(async (tx) => {
    const profile = await tx.userProfile.create({
      data: {
        authUserId,
        fullName: data.fullName,
        email,
        roles: ["CUSTOMER"],
      },
    });

    await tx.loyaltyCard.create({
      data: {
        profileId: profile.id,
        cardNumber: generateCardNumber(),
        qrToken: generateQrToken(),
      },
    });

    await tx.auditEvent.create({
      data: {
        actorId: profile.id,
        action: "ACCOUNT_SIGNUP",
        metadata: { method: "external_auth" },
      },
    });
  });

  redirect("/auth/finish");
}

export async function updateCustomerAccountAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const profile = await requireProfile(["CUSTOMER"]);
  const parsed = profileSettingsSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { errors, message: firstError(errors) };
  }

  const data = parsed.data;
  const username = data.username ?? null;
  const mobile = data.mobile ?? null;
  const profileConflicts = username || mobile
    ? await prisma.userProfile.findFirst({
      where: {
        id: { not: profile.id },
        OR: [
          ...(username ? [{ username }] : []),
          ...(mobile ? [{ mobile }] : []),
        ],
      },
      select: { username: true, mobile: true },
    })
    : null;

  if (profileConflicts) {
    return {
      message: "Username or mobile is already registered.",
      errors: {
        username: profileConflicts.username === username ? ["Username is already taken."] : undefined,
        mobile: profileConflicts.mobile === mobile ? ["Mobile is already registered."] : undefined,
      },
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.userProfile.update({
      where: { id: profile.id },
      data: {
        fullName: data.fullName,
        username,
        mobile,
      },
    });

    await tx.auditEvent.create({
      data: {
        actorId: profile.id,
        action: "ACCOUNT_PROFILE_UPDATED",
        metadata: {
          hasUsername: Boolean(username),
          hasMobile: Boolean(mobile),
        },
      },
    });
  });

  revalidatePath("/profile");
  return { ok: true, message: "Account details updated." };
}

export async function changeForcedPasswordAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const profile = await requirePasswordResetProfile();
  const parsed = forcedPasswordChangeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { errors, message: firstError(errors) };
  }

  const result = await auth.changePassword({
    currentPassword: parsed.data.currentPassword,
    newPassword: parsed.data.newPassword,
    revokeOtherSessions: true,
  });
  if (result.error) return { message: result.error.message ?? "Password change failed." };

  await prisma.$transaction(async (tx) => {
    await tx.userProfile.update({
      where: { id: profile.id },
      data: { mustChangePassword: false },
    });
    await tx.auditEvent.create({
      data: {
        actorId: profile.id,
        action: "ACCOUNT_PASSWORD_CHANGED",
        metadata: {
          forcedReset: true,
        },
      },
    });
  });

  redirect("/auth/finish");
}

