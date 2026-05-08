import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";

const NEON_AUTH_COOKIE_PREFIX = "__Secure-neon-auth";

export async function POST(request: NextRequest) {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Neon Auth sign-out failed; clearing local auth cookies.", error);
  }

  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith(NEON_AUTH_COOKIE_PREFIX)) {
      response.cookies.delete(cookie.name);
    }
  }

  return response;
}
