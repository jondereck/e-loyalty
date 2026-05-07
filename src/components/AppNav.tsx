import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/lib/services/auth";

export function AppNav({
  active,
  mode = "public",
  showAdmin = false,
}: {
  active?: string;
  mode?: "public" | "staff";
  showAdmin?: boolean;
}) {
  const links = mode === "staff"
    ? [
        ["/cashier/scan", "Scan", "cashier"],
        ...(showAdmin ? [["/admin/dashboard", "Admin", "admin"] as const] : []),
      ] as const
    : [
        ["/", "Home", "home"],
        ["/#card-preview", "Card", "card"],
        ["/#rewards-preview", "Rewards", "rewards"],
        ["/login", "Login", "login"],
        ["/signup", "Sign up", "signup"],
      ] as const;

  return (
    <header className="topbar">
      <nav className="nav">
        <Link className="brand" href="/">
          <span className="logo">L</span>
          <span>Loyalty Pass</span>
        </Link>
        <div className="navlinks">
          {links.map(([href, label, key]) => (
            <Link key={href} className={active === key ? "active" : ""} href={href}>
              {label}
            </Link>
          ))}
          {mode === "staff" ? (
            <form action={logoutAction}>
              <button className="nav-action" type="submit" aria-label="Logout">
                <LogOut size={15} />
                Logout
              </button>
            </form>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
