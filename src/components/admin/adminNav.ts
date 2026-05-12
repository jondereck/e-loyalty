import {
  ClipboardCheck,
  LayoutDashboard,
  MapPin,
  Settings,
  UserCircle,
  Users,
  BarChart3,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { RoleModuleKey } from "@/lib/rbac";

export type AdminNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  module: RoleModuleKey;
  superAdminOnly?: boolean;
};

export const adminNavLinks: AdminNavLink[] = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard, module: "OVERVIEW" },
  { href: "/admin/members", label: "Members", icon: Users, module: "MEMBERS" },
  { href: "/admin/approvals", label: "Approvals", icon: ClipboardCheck, module: "APPROVALS" },
  { href: "/admin/staff", label: "Staff", icon: UserCircle, module: "STAFF" },
  { href: "/admin/branches", label: "Branches", icon: MapPin, module: "BRANCHES" },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, module: "REPORTS" },
  { href: "/super-admin/reports", label: "System Reports", icon: BarChart3, module: "SYSTEM_REPORTS", superAdminOnly: true },
  { href: "/super-admin/settings", label: "Settings", icon: Settings, module: "SETTINGS", superAdminOnly: true },
];

export function getVisibleAdminNavLinks(showSuperAdmin = false, enabledModules?: Set<RoleModuleKey>) {
  const links = adminNavLinks.filter((link) => {
    if (link.superAdminOnly && !showSuperAdmin) return false;
    return showSuperAdmin || !enabledModules || enabledModules.has(link.module);
  });

  if (showSuperAdmin) {
    return links.filter((link) => link.href !== "/admin/reports");
  }

  return links;
}
