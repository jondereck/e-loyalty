import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { getAuthUser, getCurrentProfile, redirectForRoles } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [user, profile] = await Promise.all([getAuthUser(), getCurrentProfile()]);
  if (profile) redirect(redirectForRoles(profile.roles));
  if (user) redirect("/complete-profile");

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <Link className="auth-brand" href="/">
          <span className="logo">L</span>
          <span>Loyalty Pass</span>
        </Link>
        <h1>Welcome back</h1>
        <p className="auth-subtitle">Sign in to your loyalty workspace</p>
        <LoginForm />
        <div className="auth-footer-block">
          <div className="auth-product-line">
            <Building2 size={18} />
            <span>Loyalty Management System</span>
          </div>
          <p className="muted">
            Need an account? <Link href="/signup">Sign up</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
