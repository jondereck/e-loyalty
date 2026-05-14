import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";
import { getExpiredAuthCookieOptionVariants, getNeonAuthCookieNames, shouldUseSecureAuthCookies } from "@/lib/auth/cookies";
import {
  createPendingAccountConnectToken,
  PENDING_CONNECT_COOKIE,
  PENDING_CONNECT_TTL_SECONDS,
} from "@/lib/services/account-connections";
import { getCurrentProfile } from "@/lib/services/session";

export async function POST(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "ACTIVE") {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  try {
    await auth.signOut();
  } catch (error) {
    console.error("Neon Auth sign-out failed before account connection flow; clearing local auth cookies.", error);
  }

  const response = NextResponse.redirect(new URL("/login?connect=account", request.url), { status: 303 });
  response.cookies.set(PENDING_CONNECT_COOKIE, createPendingAccountConnectToken(profile.id), {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureAuthCookies(request.url),
    path: "/",
    maxAge: PENDING_CONNECT_TTL_SECONDS,
  });
  clearAuthCookies(request, response);
  return response;
}

function clearAuthCookies(request: NextRequest, response: NextResponse) {
  const cookieOptionVariants = getExpiredAuthCookieOptionVariants({
    secure: shouldUseSecureAuthCookies(request.url),
  });

  for (const name of getNeonAuthCookieNames(request.cookies.getAll())) {
    for (const cookieOptions of cookieOptionVariants) {
      response.cookies.set(name, "", cookieOptions);
    }
  }
}
