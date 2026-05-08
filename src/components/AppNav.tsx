import Link from "next/link";
import { LogoutSubmitButton } from "@/components/auth/LogoutSubmitButton";
import { getBrandingSettings } from "@/lib/services/settings";

export async function AppNav({
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
  const branding = await getBrandingSettings();

  return (
    <header className="topbar">
      <nav className="nav">
        <Link className="brand" href="/">
          <span className="logo">{branding.systemName.charAt(0).toUpperCase()}</span>
          <span>{branding.systemName}</span>
        </Link>
        <div className="navlinks">
          {links.map(([href, label, key]) => (
            <Link key={href} className={active === key ? "active" : ""} href={href}>
              {label}
            </Link>
          ))}
          {mode === "staff" ? (
            <form action="/api/auth/logout" method="post">
              <LogoutSubmitButton className="nav-action" iconSize={15} />
            </form>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
