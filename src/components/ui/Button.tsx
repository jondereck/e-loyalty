import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "secondary" | "success" | "danger";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return <button className={cn("btn", variant !== "default" && variant, className)} {...props} />;
}

export function ButtonLink({
  href,
  children,
  variant = "default",
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
  variant?: ButtonProps["variant"];
}) {
  return (
    <Link href={href} className={cn("btn", variant !== "default" && variant, className)} {...props}>
      {children}
    </Link>
  );
}

