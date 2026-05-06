import Link from "next/link";
import { Building2, ClipboardCheck, LayoutDashboard, Settings, Shield, Users } from "lucide-react";

const links = [
  { href: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/admin/branches", label: "Branches", icon: Building2 },
  { href: "/admin/staff", label: "Staff", icon: Users },
  { href: "/super-admin/dashboard", label: "Super Admin", icon: Shield },
  { href: "/super-admin/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ active }: { active: string }) {
  return (
    <aside className="card sidebar side">
      <Link className="brand" href="/" style={{ marginBottom: 14 }}>
        <span className="logo">L</span>
        <span>Loyalty Pass</span>
      </Link>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link key={link.href} className={active === link.href ? "active" : ""} href={link.href}>
            <Icon size={16} />
            {link.label}
          </Link>
        );
      })}
    </aside>
  );
}

