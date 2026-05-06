"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { generateCardNumber, generateQrToken } from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import { redirectForRoles } from "@/lib/services/session";
import { loginSchema, signupSchema, type AuthActionState } from "@/lib/validations/auth";

function firstError(errors: Record<string, string[] | undefined>) {
  return Object.values(errors).flat().find(Boolean) ?? "Please check the form.";
}

export async function signupAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { errors, message: firstError(errors) };
  }

  const data = parsed.data;
  const existing = await prisma.userProfile.findFirst({
    where: {
      OR: [{ email: data.email }, { username: data.username }, { mobile: data.mobile }],
    },
    select: { email: true, username: true, mobile: true },
  });

  if (existing) {
    return {
      message: "Email, username, or mobile is already registered.",
      errors: {
        email: existing.email === data.email ? ["Email is already registered."] : undefined,
        username: existing.username === data.username ? ["Username is already taken."] : undefined,
        mobile: existing.mobile === data.mobile ? ["Mobile is already registered."] : undefined,
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
        username: data.username,
        mobile: data.mobile,
        email: data.email,
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
  });

  redirect("/card");
}

export async function loginAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return { errors, message: firstError(errors) };
  }

  const identifier = parsed.data.identifier.toLowerCase();
  const profile = await prisma.userProfile.findFirst({
    where: {
      OR: [{ email: identifier }, { username: identifier }, { mobile: parsed.data.identifier }],
    },
  });

  const email = profile?.email ?? (identifier.includes("@") ? identifier : null);
  if (!email) return { message: "No account found for that identifier." };

  const result = await auth.signIn.email({
    email,
    password: parsed.data.password,
  });

  if (result.error) return { message: result.error.message };

  if (!profile) return { message: "Authenticated, but no loyalty profile exists yet." };
  redirect(redirectForRoles(profile.roles));
}

export async function logoutAction() {
  await auth.signOut();
  redirect("/login");
}

