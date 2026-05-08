import type { ReactNode } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { getBrandingSettings } from "@/lib/services/settings";
import { getCurrentProfile } from "@/lib/services/session";

export async function AdminShell({
  active,
  children,
}: {
  active: string;
  children: ReactNode;
}) {
  const [profile, branding] = await Promise.all([getCurrentProfile(), getBrandingSettings()]);
  const showHeader = active.includes("dashboard");

  return (
    <main className="lp-admin-page">
      <div className="lp-admin-window">
        <Sidebar active={active} showSuperAdmin={profile?.roles.includes("SUPER_ADMIN")} profile={profile} systemName={branding.systemName} />
        <section className="lp-admin-main">
          {showHeader ? (
            <div className="lp-admin-head">
              <h2>Admin Dashboard</h2>
            </div>
          ) : null}
          {children}
        </section>
      </div>
    </main>
  );
}

