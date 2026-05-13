import Link from "next/link";
import { Sparkles } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { getVisibleAdminNavLinks } from "@/components/admin/adminNav";
import { SidebarProfileMenu } from "@/components/admin/SidebarProfileMenu";
import type { RoleModuleKey } from "@/lib/rbac";
import type { CurrentProfile } from "@/lib/services/session";

export function Sidebar({
  active,
  showSuperAdmin = false,
  profile,
  systemName,
  enabledModules,
}: {
  active: string;
  showSuperAdmin?: boolean;
  profile?: CurrentProfile | null;
  systemName: string;
  enabledModules?: Set<RoleModuleKey>;
}) {
  const visibleLinks = getVisibleAdminNavLinks(showSuperAdmin, enabledModules);

  return (
    <aside className="lp-admin-sidebar">
      <Link className="lp-admin-brand" href="/admin/dashboard">
        <span className="lp-brand-icon"><Sparkles size={18} /></span>
        <span>{systemName}</span>
      </Link>
      {visibleLinks.map((link) => {
        const Icon = link.icon;
        return (
          <Link key={link.href} className={active === link.href ? "lp-side-link active" : "lp-side-link"} href={link.href}>
            <Icon size={16} />
            {link.label}
          </Link>
        );
      })}
      <div className="lp-admin-sidebar-tools">
        <span>Notifications</span>
        <NotificationBell className="lp-admin-notification-button" />
      </div>
      <SidebarProfileMenu
        name={profile?.fullName ?? "Admin"}
        avatarUrl={profile?.avatarUrl ?? null}
        roleLabel={showSuperAdmin ? "Super Admin" : "Administrator"}
      />
    </aside>
  );
}

