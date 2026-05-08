"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/Button";

type LogoutSubmitButtonProps = {
  className?: string;
  iconSize?: number;
  label?: string;
  variant?: "default" | "primary" | "secondary" | "success" | "danger";
};

export function LogoutSubmitButton({
  className,
  iconSize = 18,
  label = "Logout",
  variant,
}: LogoutSubmitButtonProps) {
  const [pending, setPending] = useState(false);
  const icon = pending ? <Loader2 className="spin" size={iconSize} /> : <LogOut size={iconSize} />;

  async function handleLogout() {
    setPending(true);
    try {
      await authClient.signOut();
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout failed; redirecting to login.", error);
    } finally {
      window.location.replace("/login");
    }
  }

  if (variant) {
    return (
      <Button variant={variant} type="button" className={className} disabled={pending} aria-busy={pending} onClick={handleLogout}>
        {icon}
        {pending ? "Logging out" : label}
      </Button>
    );
  }

  return (
    <button className={className} type="button" disabled={pending} aria-busy={pending} onClick={handleLogout}>
      {icon}
      {pending ? "Logging out" : label}
    </button>
  );
}
