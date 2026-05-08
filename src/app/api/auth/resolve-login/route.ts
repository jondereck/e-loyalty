import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveLoginIdentifier } from "@/lib/services/login-identifier";

const resolveLoginSchema = z.object({
  identifier: z.string().min(3, "Email, mobile, or username is required.").trim(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resolveLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.flatten().fieldErrors.identifier?.[0] ?? "Enter a valid login." }, { status: 400 });
  }

  const { profile, email } = await resolveLoginIdentifier(parsed.data.identifier);
  if (!email) {
    return NextResponse.json({ message: "No account found for that identifier." }, { status: 404 });
  }

  if (profile?.status && profile.status !== "ACTIVE") {
    return NextResponse.json({ message: "This account is not active. Contact an administrator." }, { status: 403 });
  }

  return NextResponse.json({ email });
}
