import { auth } from "@/lib/auth/server";

const authProxy = auth.middleware({ loginUrl: "/login" });

export function proxy(request: Parameters<typeof authProxy>[0]) {
  return authProxy(request);
}

export const config = {
  matcher: [
    "/auth/callback",
    "/auth/finish",
    "/auth/finalize",
    "/complete-profile",
    "/card/:path*",
    "/profile/:path*",
    "/history/:path*",
    "/rewards/:path*",
    "/cashier/:path*",
    "/admin/:path*",
    "/super-admin/:path*",
  ],
};
