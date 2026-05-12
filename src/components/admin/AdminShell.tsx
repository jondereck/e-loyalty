import type { ReactNode } from "react";
import { Sidebar } from "@/components/admin/Sidebar";
import { getBrandingSettings } from "@/lib/services/settings";
import { getCurrentProfile } from "@/lib/services/session";
import { resolveProfileModules } from "@/lib/rbac";

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
  const enabledModules = resolveProfileModules(profile);

  return (
    <main className="lp-admin-page">
      <div className="lp-admin-window">
        <Sidebar active={active} showSuperAdmin={isSuperAdmin} profile={profile} systemName={branding.systemName} enabledModules={enabledModules} />
        <section className="lp-admin-main">
          {title ? <h2 className="lp-admin-main-title">{title}</h2> : null}
          {children}
        </section>
      </div>
    </main>
  );
}

