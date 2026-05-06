import Link from "next/link";

export function AppNav({ active }: { active?: string }) {
  const links = [
    ["/", "Home", "home"],
    ["/card", "Card", "card"],
    ["/rewards", "Rewards", "rewards"],
    ["/history", "History", "history"],
    ["/cashier/scan", "Cashier", "cashier"],
    ["/admin/dashboard", "Admin", "admin"],
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
        </div>
      </nav>
    </header>
  );
}
