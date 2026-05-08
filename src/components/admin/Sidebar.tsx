import Link from "next/link";
import { ChevronDown, Sparkles, UserCircle } from "lucide-react";
import { LogoutSubmitButton } from "@/components/auth/LogoutSubmitButton";
import { getVisibleAdminNavLinks } from "@/components/admin/adminNav";
import type { CurrentProfile } from "@/lib/services/session";

export function Sidebar({
  active,
  showSuperAdmin = false,
  profile,
  systemName,
}: {
  active: string;
  showSuperAdmin?: boolean;
  profile?: CurrentProfile | null;
  systemName: string;
}) {
  const visibleLinks = getVisibleAdminNavLinks(showSuperAdmin);

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
          <form action="/api/auth/logout" method="post">
            <LogoutSubmitButton iconSize={15} />
          </form>
        </div>
      </details>
    </aside>
  );
}

