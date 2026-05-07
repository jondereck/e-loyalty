import Link from "next/link";
import { ChevronDown, ClipboardCheck, LayoutDashboard, LogOut, MapPin, Settings, Shield, Sparkles, UserCircle, Users } from "lucide-react";
import { logoutAction } from "@/lib/services/auth";
import type { CurrentProfile } from "@/lib/services/session";

const links = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/members", label: "Members", icon: Users },
  { href: "/admin/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/admin/staff", label: "Staff", icon: UserCircle },
  { href: "/admin/branches", label: "Branches", icon: MapPin },
  { href: "/super-admin/settings", label: "Settings", icon: Settings },
  { href: "/super-admin/dashboard", label: "Super Admin", icon: Shield },
];

export function Sidebar({
  active,
  showSuperAdmin = false,
  profile,
}: {
  active: string;
  showSuperAdmin?: boolean;
  profile?: CurrentProfile | null;
}) {
  const visibleLinks = showSuperAdmin ? links : links.filter((link) => !link.href.startsWith("/super-admin"));

  return (
    <aside className="lp-admin-sidebar">
      <Link className="lp-admin-brand" href="/admin/dashboard">
        <span className="lp-brand-icon"><Sparkles size={18} /></span>
        <span>Loyalty Pass</span>
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
      <details className="lp-admin-account">
        <summary className="lp-admin-user">
          <span className="lp-avatar small">{profile?.fullName.slice(0, 2).toUpperCase() ?? "AD"}</span>
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
          <form action={logoutAction}>
            <button type="submit">
              <LogOut size={15} />
              Logout
            </button>
          </form>
        </div>
      </details>
    </aside>
  );
}

