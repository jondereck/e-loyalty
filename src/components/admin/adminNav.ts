import {
  ClipboardCheck,
  LayoutDashboard,
  MapPin,
  Settings,
  UserCircle,
  Users,
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
  { href: "/super-admin/settings", label: "Settings", icon: Settings, superAdminOnly: true },
];

export function getVisibleAdminNavLinks(showSuperAdmin = false) {
  return showSuperAdmin ? adminNavLinks : adminNavLinks.filter((link) => !link.superAdminOnly);
}
