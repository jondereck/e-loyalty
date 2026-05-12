import Link from "next/link";
import { ChevronDown, Sparkles, UserCircle } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { UserAvatar } from "@/components/UserAvatar";
import { LogoutSubmitButton } from "@/components/auth/LogoutSubmitButton";
import { getVisibleAdminNavLinks } from "@/components/admin/adminNav";
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
      <details className="lp-admin-account">
        <summary className="lp-admin-user">
          <UserAvatar name={profile?.fullName ?? "Admin"} imageUrl={profile?.avatarUrl} className="lp-avatar small" />
          <div>
            <b>{profile?.fullName ?? "Admin"}</b>
            <span>{showSuperAdmin ? "Super Admin" : "Administrator"}</span>
          </div>
          <ChevronDown size={16} />
        </summary>
        <div className="lp-admin-account-menu">
          <Link href="/profile">
            <UserCircle size={15} />
            Manage account
          </Link>
          <form action="/api/auth/logout" method="post">
            <LogoutSubmitButton iconSize={15} />
          </form>
        </div>
      </details>
    </aside>
  );
}

