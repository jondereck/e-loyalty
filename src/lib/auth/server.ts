import { createNeonAuth } from "@neondatabase/auth/next/server";
import { neonAuthCookieDomain } from "@/lib/auth/cookies";

const baseUrl = process.env.NEON_AUTH_BASE_URL || "http://localhost:9999";
const secret =
  process.env.NEON_AUTH_COOKIE_SECRET ||
  "development-only-cookie-secret-change-before-production";

export const auth = createNeonAuth({
  baseUrl,
  cookies: {
    secret,
    ...(neonAuthCookieDomain ? { domain: neonAuthCookieDomain } : {}),
  },
});
