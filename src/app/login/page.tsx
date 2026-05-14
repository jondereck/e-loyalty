import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getBrandingSettings } from "@/lib/services/settings";
import { getAuthUser, getCurrentProfile, isProfileComplete, redirectForProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ connect?: string | string[]; error?: string | string[]; identifier?: string | string[]; switch?: string | string[] }>;
}) {
  const params = await searchParams;
  const authContext = readParam(params.connect) === "account"
    ? "connect"
    : readParam(params.switch) === "account"
      ? "switch"
      : undefined;
  const initialIdentifier = readParam(params.identifier) ?? "";
  const error = readParam(params.error);
  const [user, profile, branding] = await Promise.all([getAuthUser(), getCurrentProfile(), getBrandingSettings()]);
  if (profile && isProfileComplete(profile)) redirect(profile.mustChangePassword ? "/auth/force-password" : redirectForProfile(profile));
  if (profile) redirect("/complete-profile");
  if (user) redirect("/complete-profile");

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <Link className="auth-brand" href="/">
          <span className="logo">{branding.systemName.charAt(0).toUpperCase()}</span>
          <span>{branding.systemName}</span>
        </Link>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">{authSubtitle(authContext)}</p>
        <LoginForm
          initialIdentifier={initialIdentifier}
          initialMessage={error === "unavailable" ? "That connected account is no longer available." : undefined}
        />
        <div className="auth-footer-block">
          <p className="muted">
            Need an account? <Link href="/signup">Sign up</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function readParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function authSubtitle(context?: "connect" | "switch") {
  if (context === "connect") return "Sign in to the account you want to connect";
  if (context === "switch") return "Sign in to switch accounts";
  return "Sign in to your loyalty workspace";
}
