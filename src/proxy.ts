import { auth } from "@/lib/auth/server";

export default auth.middleware({ loginUrl: "/login" });

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
