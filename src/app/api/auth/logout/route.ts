import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth/server";

const NEON_AUTH_COOKIE_PREFIX = "__Secure-neon-auth";
const AUTH_COOKIE_PATTERNS = ["neon-auth", "better-auth", "session_token", "session_data"];

export async function POST(request: NextRequest) {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Neon Auth sign-out failed; clearing local auth cookies.", error);
  }

  const response = NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  for (const cookie of request.cookies.getAll()) {
    if (shouldDeleteAuthCookie(cookie.name)) {
      response.cookies.set(cookie.name, "", {
        path: "/",
        maxAge: 0,
        expires: new Date(0),
        httpOnly: true,
        sameSite: "lax",
      });
    }
  }

  return response;
}

function shouldDeleteAuthCookie(name: string) {
  return name.startsWith(NEON_AUTH_COOKIE_PREFIX) || AUTH_COOKIE_PATTERNS.some((pattern) => name.includes(pattern));
}
