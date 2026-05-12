import { ForcedPasswordChangeForm } from "@/components/auth/ForcedPasswordChangeForm";
import { requirePasswordResetProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function ForcePasswordPage() {
  const profile = await requirePasswordResetProfile();

  return (
    <main className="auth-screen">
      <section className="auth-panel">
        <h1>Update your password</h1>
        <p className="auth-subtitle">Hi {profile.fullName.split(" ")[0]}, replace the temporary password before entering the workspace.</p>
        <ForcedPasswordChangeForm />
      </section>
    </main>
  );
}
