import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/SignupForm";
import { getAuthUser, getCurrentProfile, redirectForRoles } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const [user, profile] = await Promise.all([getAuthUser(), getCurrentProfile()]);
  if (profile) redirect(redirectForRoles(profile.roles));
  if (user) redirect("/complete-profile");

  return (
    <main className="auth-screen">
      <section className="auth-panel signup-panel">
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
