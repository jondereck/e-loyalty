import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";
import { getExpiredAuthCookieOptionVariants, getNeonAuthCookieNames, shouldUseSecureAuthCookies } from "@/lib/auth/cookies";
import { getConnectedAccountForSwitch } from "@/lib/services/account-connections";
import { getCurrentProfile } from "@/lib/services/session";

export async function POST(request: NextRequest) {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "ACTIVE") {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const connectedProfileId = String(formData.get("profileId") ?? "");
  const connectedProfile = await getConnectedAccountForSwitch(profile.id, connectedProfileId);
  const loginUrl = connectedProfile
    ? `/login?switch=account&identifier=${encodeURIComponent(connectedProfile.email)}`
    : "/login?switch=account&error=unavailable";

  try {
    await auth.signOut();
  } catch (error) {
    console.error("Neon Auth sign-out failed before account switch flow; clearing local auth cookies.", error);
  }

  const response = NextResponse.redirect(new URL(loginUrl, request.url), { status: 303 });
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
