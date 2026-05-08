"use client";

import { useFormStatus } from "react-dom";
import { Loader2, LogOut } from "lucide-react";
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
  const { pending } = useFormStatus();
  const icon = pending ? <Loader2 className="spin" size={iconSize} /> : <LogOut size={iconSize} />;

  if (variant) {
    return (
      <Button variant={variant} type="submit" className={className} disabled={pending} aria-busy={pending}>
        {icon}
        {pending ? "Logging out" : label}
      </Button>
    );
  }

  return (
    <button className={className} type="submit" disabled={pending} aria-busy={pending}>
      {icon}
      {pending ? "Logging out" : label}
    </button>
  );
}
