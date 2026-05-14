import Link from "next/link";
import { LogoutSubmitButton } from "@/components/auth/LogoutSubmitButton";
import { NotificationBell } from "@/components/NotificationBell";
import { getBrandingSettings } from "@/lib/services/settings";
import { cn } from "@/lib/utils";

export async function AppNav({
  active,
  mode = "public",
  showAdmin = false,
  adminHref = "/admin/dashboard",
}: {
  active?: string;
  mode?: "public" | "staff";
  showAdmin?: boolean;
  adminHref?: string;
}) {
  const links = mode === "staff"
    ? [
        ["/cashier/scan", "Scan", "cashier"],
        ...(showAdmin ? [[adminHref, "Admin", "admin"] as const] : []),
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
    <header className={cn("topbar", mode === "staff" && "lp-staff-topbar")}>
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
            <>
              <NotificationBell />
              <form action="/api/auth/logout" method="post">
                <LogoutSubmitButton className="nav-action" iconSize={15} />
              </form>
            </>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
