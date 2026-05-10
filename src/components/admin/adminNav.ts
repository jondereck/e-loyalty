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

export type AdminNavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  superAdminOnly?: boolean;
};

export const adminNavLinks: AdminNavLink[] = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/admin/staff", label: "Staff", icon: UserCircle },
  { href: "/admin/branches", label: "Branches", icon: MapPin },
  { href: "/admin/reports", label: "Reports", icon: BarChart3 },
  { href: "/super-admin/reports", label: "System Reports", icon: BarChart3, superAdminOnly: true },
  { href: "/super-admin/settings", label: "Settings", icon: Settings, superAdminOnly: true },
];

export function getVisibleAdminNavLinks(showSuperAdmin = false) {
  const links = showSuperAdmin ? adminNavLinks : adminNavLinks.filter((link) => !link.superAdminOnly);

  // If Super Admin, we might want to hide the regular reports link if they have System Reports
  if (showSuperAdmin) {
      return links.filter(link => link.href !== "/admin/reports");
  }

  return links;
}
