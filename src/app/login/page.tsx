import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getBrandingSettings } from "@/lib/services/settings";
import { getAuthUser, getCurrentProfile, redirectForRoles } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [user, profile, branding] = await Promise.all([getAuthUser(), getCurrentProfile(), getBrandingSettings()]);
  if (profile) redirect(profile.mustChangePassword ? "/auth/force-password" : redirectForRoles(profile.roles));
  if (user) redirect("/complete-profile");

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <Link className="auth-brand" href="/">
          <span className="logo">{branding.systemName.charAt(0).toUpperCase()}</span>
          <span>{branding.systemName}</span>
        </Link>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to your loyalty workspace</p>
        <LoginForm />
        <div className="auth-footer-block">
          <p className="muted">
            Need an account? <Link href="/signup">Sign up</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
