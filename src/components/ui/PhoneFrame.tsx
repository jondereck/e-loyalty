import type { ReactNode } from "react";
import Link from "next/link";
import { CreditCard, Gift, History, UserCircle } from "lucide-react";

export function PhoneFrame({
  children,
  active = "card",
}: {
  children: ReactNode;
  active?: "card" | "rewards" | "history" | "profile";
}) {
  const tabs = [
    { key: "card", href: "/card", label: "Card", icon: CreditCard },
    { key: "rewards", href: "/rewards", label: "Rewards", icon: Gift },
    { key: "history", href: "/history", label: "History", icon: History },
    { key: "profile", href: "/profile", label: "Account", icon: UserCircle },
  ] as const;

  return (
    <div className="phone">
      <div className="phone-screen">
        <div className="statusbar">9:41</div>
        <div className="screen-content">{children}</div>
        <div className="tabbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link key={tab.key} className={active === tab.key ? "active" : ""} href={tab.href}>
                <div style={{ display: "grid", placeItems: "center", marginBottom: 2 }}>
                  <Icon size={16} />
                </div>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

