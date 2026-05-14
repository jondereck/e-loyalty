import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/SignupForm";
import { canAccessDuringMaintenance, getBrandingSettings, getMaintenanceSettings } from "@/lib/services/settings";
import { getAuthUser, getCurrentProfile, isProfileComplete, redirectForProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const [user, profile, branding, maintenance] = await Promise.all([
    getAuthUser(),
    getCurrentProfile(),
    getBrandingSettings(),
    getMaintenanceSettings(),
  ]);
  if (profile && isProfileComplete(profile)) redirect(redirectForProfile(profile));
  if (profile) redirect("/complete-profile");
  if (user) redirect("/complete-profile");
  if (!canAccessDuringMaintenance({ path: "/signup", roles: [], maintenanceEnabled: maintenance.maintenanceEnabled })) {
    redirect("/maintenance");
  }

  return (
    <main className="auth-screen">
      <section className="auth-panel signup-panel">
        <Link className="auth-brand" href="/">
          <span className="logo">{branding.systemName.charAt(0).toUpperCase()}</span>
          <span>{branding.systemName}</span>
        </Link>
        <h1>Create account</h1>
        <p className="auth-subtitle">Create your loyalty workspace</p>
        <SignupForm />
        <div className="auth-footer-block">
          <p className="muted">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
