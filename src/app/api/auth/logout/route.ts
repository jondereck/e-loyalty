import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";
import { getExpiredAuthCookieOptions, getNeonAuthCookieNames, shouldUseSecureAuthCookies } from "@/lib/auth/cookies";

export async function POST(request: NextRequest) {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Neon Auth sign-out failed; clearing local auth cookies.", error);
  }

  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  const cookieOptions = getExpiredAuthCookieOptions({
    secure: shouldUseSecureAuthCookies(request.url),
  });

  for (const name of getNeonAuthCookieNames(request.cookies.getAll())) {
    response.cookies.set(name, "", cookieOptions);
  }

  return response;
}
