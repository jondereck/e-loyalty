import Link from "next/link";
import { redirect } from "next/navigation";
import { CompleteProfileForm } from "@/components/auth/CompleteProfileForm";
import { getBrandingSettings } from "@/lib/services/settings";
import { getAuthUser, getCurrentProfile, redirectForRoles } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function CompleteProfilePage() {
  const [user, profile, branding] = await Promise.all([getAuthUser(), getCurrentProfile(), getBrandingSettings()]);
  if (!user) redirect("/login");
  if (profile) redirect(redirectForRoles(profile.roles));

  return (
    <main className="auth-screen">
      <section className="auth-panel signup-panel">
        <Link className="auth-brand" href="/">
          <span className="logo">{branding.systemName.charAt(0).toUpperCase()}</span>
          <span>{branding.systemName}</span>
        </Link>
        <h1>Complete profile</h1>
        <p className="auth-subtitle">Finish your account now and add extra details later in Manage account.</p>
        <CompleteProfileForm email={user.email} name={user.name} />
      </section>
    </main>
  );
}
