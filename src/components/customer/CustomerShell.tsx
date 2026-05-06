import type { ReactNode } from "react";
import Link from "next/link";
import { CreditCard, Gift, History, UserCircle } from "lucide-react";

type CustomerTab = "card" | "rewards" | "history" | "profile";

const tabs = [
  { key: "card", href: "/card", label: "Card", icon: CreditCard },
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
  return (
    <main className="customer-shell">
      <div className="customer-app">
        <header className="customer-header">
          <Link className="brand" href="/card">
            <span className="logo">L</span>
            <span>Loyalty Pass</span>
          </Link>
          <div>
            {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
            <h1>{title}</h1>
          </div>
        </header>
        <div className="customer-content">{children}</div>
      </div>
      <nav className="customer-tabbar" aria-label="Customer navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Link key={tab.key} className={active === tab.key ? "active" : ""} href={tab.href}>
              <Icon size={18} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
