"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/#card-preview", label: "Card" },
  { href: "/#rewards-preview", label: "Rewards" },
  { href: "/login", label: "Login" },
  { href: "/signup", label: "Sign up" },
];

export function HomeMobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <div className="lp-home-mobile-menu">
      <button
        type="button"
        aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-controls="lp-home-mobile-menu-panel"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {isOpen ? (
        <nav id="lp-home-mobile-menu-panel" aria-label="Mobile homepage navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
