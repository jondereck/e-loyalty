import type { ReactNode } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { getBrandingSettings } from "@/lib/services/settings";
import { getCurrentProfile } from "@/lib/services/session";

export async function AdminShell({
  active,
  children,
  title,
  showSuperAdmin,
}: {
  active: string;
  children: ReactNode;
  title?: string;
  showSuperAdmin?: boolean;
}) {
  const [profile, branding] = await Promise.all([getCurrentProfile(), getBrandingSettings()]);
  const isSuperAdmin = showSuperAdmin ?? profile?.roles.includes("SUPER_ADMIN");
  const displayTitle = title ?? (active.includes("dashboard") ? "Admin Dashboard" : undefined);

  return (
    <main className="lp-admin-page">
      <div className="lp-admin-window">
        <Sidebar active={active} showSuperAdmin={isSuperAdmin} profile={profile} systemName={branding.systemName} />
        <section className="lp-admin-main">
          <header className="lp-admin-global-header">
            <div className="lp-admin-header-title">
              {displayTitle ? <h2>{displayTitle}</h2> : null}
            </div>
            <div className="lp-admin-header-actions">
              <NotificationBell />
            </div>
          </header>
          {children}
        </section>
      </div>
    </main>
  );
}

