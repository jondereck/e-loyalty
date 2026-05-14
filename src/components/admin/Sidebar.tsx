import Link from "next/link";
import { Sparkles } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { getVisibleAdminNavLinks } from "@/components/admin/adminNav";
import { SidebarProfileMenu, type ConnectedAccount } from "@/components/admin/SidebarProfileMenu";
import { moduleForPath, type RoleModuleKey } from "@/lib/rbac";
import type { CurrentProfile } from "@/lib/services/session";

export function Sidebar({
  active,
  showSuperAdmin = false,
  profile,
  systemName,
  enabledModules,
  connectedAccounts = [],
}: {
  active: string;
  showSuperAdmin?: boolean;
  profile?: CurrentProfile | null;
  systemName: string;
  enabledModules?: Set<RoleModuleKey>;
  connectedAccounts?: ConnectedAccount[];
}) {
  const visibleLinks = getVisibleAdminNavLinks(showSuperAdmin, enabledModules);
  const roleLabel = profile ? profileRoleLabel(profile, active) : "Admin";

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
        email={profile?.email ?? "No email"}
        avatarUrl={profile?.avatarUrl ?? null}
        roleLabel={roleLabel}
        settingsHref={profile?.roles.includes("SUPER_ADMIN") ? "/super-admin/settings" : null}
        connectedAccounts={connectedAccounts}
      />
    </aside>
  );
}

function profileRoleLabel(profile: CurrentProfile, activePath: string) {
  if (profile.roles.includes("SUPER_ADMIN")) return "Super Admin";

  const activeModule = moduleForPath(activePath);
  const activeAssignments = profile.staffAssignments.filter((assignment) =>
    assignment.status === "ACTIVE" &&
    assignment.branch.status === "ACTIVE" &&
    assignment.roleDefinition?.status === "ACTIVE"
  );

  const matchingRole = activeAssignments.find((assignment) =>
    activeModule
      ? assignment.roleDefinition?.permissions.some((permission) => permission.module === activeModule)
      : false
  )?.roleDefinition?.name;
  if (matchingRole) return matchingRole;

  const assignedRole = activeAssignments[0]?.roleDefinition?.name;
  if (assignedRole) return assignedRole;

  if (profile.roles.includes("BRANCH_ADMIN")) return "Branch Manager";
  if (profile.roles.includes("CASHIER")) return "Cashier";
  return "Customer";
}

