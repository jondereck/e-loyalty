import type { ReactNode } from "react";
import Link from "next/link";
import { Gift, History, Home, UserCircle } from "lucide-react";

type CustomerTab = "card" | "rewards" | "history" | "profile";

const tabs = [
  { key: "card", href: "/card", label: "Home", icon: Home },
  { key: "rewards", href: "/rewards", label: "Rewards", icon: Gift },
  { key: "history", href: "/history", label: "History", icon: History },
  { key: "profile", href: "/profile", label: "Account", icon: UserCircle },
] as const;

export function CustomerShell({
  active,
  title,
  eyebrow,
  children,
}: {
  active: CustomerTab;
  title: string;
  eyebrow?: string;
  children: ReactNode;
}) {
  void title;
  void eyebrow;

  return (
    <main className="lp-mobile-shell">
      <div className="lp-mobile-content">{children}</div>
      <nav className="lp-mobile-tabbar" aria-label="Customer navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link key={tab.key} className={active === tab.key ? "active lp-mobile-tab" : "lp-mobile-tab"} href={tab.href}>
              <Icon size={18} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
