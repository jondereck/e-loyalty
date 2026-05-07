import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { CompleteProfileForm } from "@/components/auth/CompleteProfileForm";
import { getAuthUser, getCurrentProfile, redirectForRoles } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function CompleteProfilePage() {
  const [user, profile] = await Promise.all([getAuthUser(), getCurrentProfile()]);
  if (!user) redirect("/login");
  if (profile) redirect(redirectForRoles(profile.roles));

  return (
    <main className="auth-screen">
      <section className="auth-panel signup-panel">
        <Link className="auth-brand" href="/">
          <span className="logo">L</span>
          <span>Loyalty Pass</span>
        </Link>
        <h1>Complete profile</h1>
        <p className="auth-subtitle">Add your loyalty account details</p>
        <CompleteProfileForm email={user.email} name={user.name} />
        <div className="auth-footer-block">
          <div className="auth-product-line">
            <Building2 size={18} />
            <span>Loyalty Management System</span>
          </div>
        </div>
      </section>
    </main>
  );
}
