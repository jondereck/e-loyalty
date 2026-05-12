import { describe, expect, it } from "vitest";
import {
  getExpiredAuthCookieOptions,
  getExpiredAuthCookieOptionVariants,
  getNeonAuthCookieNames,
  NEON_AUTH_COOKIE_NAMES,
  shouldUseSecureAuthCookies,
} from "@/lib/auth/cookies";

describe("Neon Auth cookie clearing", () => {
  it("expires production auth cookies with secure browser attributes", () => {
    const options = getExpiredAuthCookieOptions({
      domain: ".example.com",
      secure: true,
    });

    expect(options).toMatchObject({
      path: "/",
      maxAge: 0,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      domain: ".example.com",
    });
    expect(options.expires.getTime()).toBe(0);
  });

  it("includes known Neon Auth cookies and matching request cookies", () => {
    const names = getNeonAuthCookieNames([
      { name: "__Secure-neon-auth.local.session_data.0" },
      { name: "__Secure-neon-auth.local.session_data.1" },
      { name: "unrelated" },
    ]);

    expect(names).toEqual(expect.arrayContaining([...NEON_AUTH_COOKIE_NAMES]));
    expect(names).toContain("__Secure-neon-auth.local.session_data.0");
    expect(names).toContain("__Secure-neon-auth.local.session_data.1");
    expect(names).not.toContain("unrelated");
  });

  it("uses secure cookie deletion for HTTPS requests", () => {
    expect(shouldUseSecureAuthCookies("https://app.example.com/api/auth/logout")).toBe(true);
    expect(shouldUseSecureAuthCookies("http://localhost:3000/api/auth/logout")).toBe(false);
  });

  it("builds both host-only and configured-domain deletion variants", () => {
    const variants = getExpiredAuthCookieOptionVariants({
      domain: ".example.com",
      secure: true,
    });

    expect(variants).toHaveLength(2);
    expect(variants[0]).not.toHaveProperty("domain");
    expect(variants[1]).toMatchObject({ domain: ".example.com", secure: true, maxAge: 0 });
  });

  it("keeps host-only deletion host-only when a domain variant is requested", () => {
    const [hostOnly] = getExpiredAuthCookieOptionVariants({
      domain: ".configured.test",
    });

    expect(hostOnly.domain).toBeUndefined();
  });
});
