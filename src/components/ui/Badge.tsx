import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Badge({
  children,
  tone = "purple",
}: {
  children: ReactNode;
  tone?: "green" | "orange" | "red" | "purple";
}) {
  return <span className={cn("badge", tone)}>{children}</span>;
}

