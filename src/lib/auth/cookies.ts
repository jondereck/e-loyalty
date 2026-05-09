const NEON_AUTH_COOKIE_PREFIX = "__Secure-neon-auth";
const LEGACY_NEON_AUTH_COOKIE_PREFIX = "neon-auth";

export const NEON_AUTH_COOKIE_NAMES = [
  "__Secure-neon-auth.session_token",
  "__Secure-neon-auth.local.session_data",
  "__Secure-neon-auth.session_challange",
] as const;

export type CookieNameSource = {
  name: string;
};

export type ExpiredAuthCookieOptions = {
  path: "/";
  maxAge: 0;
  expires: Date;
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  domain?: string;
};

export const neonAuthCookieDomain = process.env.NEON_AUTH_COOKIE_DOMAIN?.trim() || undefined;

export function shouldClearNeonAuthCookie(name: string) {
  return name.startsWith(NEON_AUTH_COOKIE_PREFIX) || name.startsWith(LEGACY_NEON_AUTH_COOKIE_PREFIX);
}

export function getNeonAuthCookieNames(cookies: Iterable<CookieNameSource> = []) {
  const names = new Set<string>(NEON_AUTH_COOKIE_NAMES);

  for (const cookie of cookies) {
    if (shouldClearNeonAuthCookie(cookie.name)) {
      names.add(cookie.name);
    }
  }

  return [...names];
}

export function shouldUseSecureAuthCookies(requestUrl?: string) {
  if (process.env.NODE_ENV === "production") return true;
  if (!requestUrl) return false;

  try {
    return new URL(requestUrl).protocol === "https:";
  } catch {
    return false;
  }
}

export function getExpiredAuthCookieOptions({
  domain = neonAuthCookieDomain,
  secure = false,
}: {
  domain?: string;
  secure?: boolean;
} = {}): ExpiredAuthCookieOptions {
  return {
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
    secure,
    sameSite: "lax",
    ...(domain ? { domain } : {}),
  };
}
