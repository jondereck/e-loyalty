"use client";

import Link from "next/link";
import { ChevronDown, UserCircle } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { LogoutSubmitButton } from "@/components/auth/LogoutSubmitButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

type SidebarProfileMenuProps = {
  name: string;
  avatarUrl?: string | null;
  roleLabel: string;
};

export function SidebarProfileMenu({ name, avatarUrl, roleLabel }: SidebarProfileMenuProps) {
  return (
    <div className="lp-admin-account">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="lp-admin-user lp-admin-user-trigger" aria-label="Open profile menu">
            <UserAvatar name={name} imageUrl={avatarUrl} className="lp-avatar small" />
            <div>
              <b>{name}</b>
              <span>{roleLabel}</span>
            </div>
            <ChevronDown size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" sideOffset={10} collisionPadding={12} className="lp-admin-account-popover">
          <DropdownMenuItem asChild>
            <Link href="/profile" className="lp-admin-account-action">
              <UserCircle size={15} />
              Manage account
            </Link>
          </DropdownMenuItem>
          <form action="/api/auth/logout" method="post" className="lp-dropdown-form">
            <LogoutSubmitButton className="lp-admin-account-action" iconSize={15} />
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
