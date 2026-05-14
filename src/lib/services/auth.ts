"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import { getExpiredAuthCookieOptionVariants, getNeonAuthCookieNames, shouldUseSecureAuthCookies } from "@/lib/auth/cookies";
import { auth } from "@/lib/auth/server";
import { generateCardNumber, generateQrToken } from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import { PUBLIC_DEFAULT_ROLE, resolvePublicProfileRoles } from "@/lib/public-profile";
import { canAccessDuringMaintenance, getMaintenanceSettings } from "@/lib/services/settings";
import { resolveLoginIdentifier } from "@/lib/services/login-identifier";
import { getAuthUser, getCurrentProfile, redirectForProfile, redirectForRoles, requirePasswordResetProfile, requireProfile } from "@/lib/services/session";
import { completeProfileSchema, forcedPasswordChangeSchema, loginSchema, profileSettingsSchema, signupSchema, type AuthActionState } from "@/lib/validations/auth";

function firstError(errors: Record<string, string[] | undefined>) {
  return Object.values(errors).flat().find(Boolean) ?? "Please check the form.";
}

export async function clearNeonAuthCookies() {
  const cookieStore = await cookies();
  const cookieOptionVariants = getExpiredAuthCookieOptionVariants({
    secure: shouldUseSecureAuthCookies(),
  });

  for (const name of getNeonAuthCookieNames(cookieStore.getAll())) {
    for (const cookieOptions of cookieOptionVariants) {
      cookieStore.set(name, "", cookieOptions);
    }
  }
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

  redirect("/complete-profile");
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

export async function finishAuthSession({ canMutateCookies = false }: { canMutateCookies?: boolean } = {}) {
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
    }
  }

  if (!profile) redirect("/complete-profile");
  if (profile.status !== "ACTIVE") {
    await auth.signOut();
    redirect("/login?error=suspended");
  }

  const { completePendingAccountConnect } = await import("@/lib/services/account-connections");
  await completePendingAccountConnect(profile, { clearCookie: canMutateCookies });

  await prisma.auditEvent.create({
    data: {
      actorId: profile.id,
      action: "ACCOUNT_LOGIN",
      metadata: { email: user.email },
    },
  });

  const currentProfile = await getCurrentProfile();
  if (!currentProfile) redirect("/complete-profile");
  const landingPath = redirectForProfile(currentProfile);
  if (!canAccessDuringMaintenance({ path: landingPath, roles: currentProfile.roles, maintenanceEnabled: (await getMaintenanceSettings()).maintenanceEnabled })) {
    redirect("/maintenance");
  }

  if (profile.mustChangePassword) {
    redirect("/auth/force-password");
  }

  redirect(landingPath);
}

export async function completeProfileAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const user = await getAuthUser();
  if (!user?.id || !user.email) return { message: "Your auth session expired. Please sign in again." };
  const authUserId = user.id;
  const email = user.email.toLowerCase();

  const parsed = completeProfileSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { errors, message: firstError(errors) };
  }

  const data = parsed.data;
  const existingProfile = await prisma.userProfile.findUnique({
    where: { authUserId },
    select: {
      id: true,
      email: true,
      roles: true,
      loyaltyCard: {
        select: { id: true },
      },
    },
  });

  if (existingProfile?.roles.some((role) => role !== PUBLIC_DEFAULT_ROLE)) {
    redirect(redirectForRoles(existingProfile.roles));
  }

  const existing = await prisma.userProfile.findFirst({
    where: {
      email,
      ...(existingProfile ? { id: { not: existingProfile.id } } : {}),
    },
    select: { email: true },
  });

  if (existing) {
    return {
      message: "Email is already registered.",
    };
  }

  await prisma.$transaction(async (tx) => {
    const profile = await tx.userProfile.upsert({
      where: { authUserId },
      create: {
        authUserId,
        fullName: data.fullName,
        email,
        roles: resolvePublicProfileRoles(),
      },
      update: {
        fullName: data.fullName,
        email,
        ...(!existingProfile?.roles.length ? { roles: resolvePublicProfileRoles(existingProfile?.roles) } : {}),
      },
    });

    if (!existingProfile?.loyaltyCard) {
      await tx.loyaltyCard.upsert({
        where: { profileId: profile.id },
        update: {},
        create: {
          profileId: profile.id,
          cardNumber: generateCardNumber(),
          qrToken: generateQrToken(),
        },
      });
    }

    await tx.auditEvent.create({
      data: {
        actorId: profile.id,
        action: existingProfile ? "ACCOUNT_PROFILE_UPDATED" : "ACCOUNT_SIGNUP",
        metadata: existingProfile
          ? { source: "complete_profile" }
          : { method: "complete_profile" },
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

