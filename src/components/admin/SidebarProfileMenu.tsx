"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronRight, Plus, Settings, UserCircle, Users } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { LogoutSubmitButton } from "@/components/auth/LogoutSubmitButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

type SidebarProfileMenuProps = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  roleLabel: string;
  settingsHref?: string | null;
  connectedAccounts?: ConnectedAccount[];
};

export type ConnectedAccount = {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  avatarUrl?: string | null;
};

export function SidebarProfileMenu({
  name,
  email,
  avatarUrl,
  roleLabel,
  settingsHref = null,
  connectedAccounts = [],
}: SidebarProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [showSwitchPanel, setShowSwitchPanel] = useState(false);
  const accounts = useMemo<ConnectedAccount[]>(
    () => [{ id: "current", name, email, roleLabel, avatarUrl }, ...connectedAccounts],
    [name, email, roleLabel, avatarUrl, connectedAccounts],
  );

  function openSwitcher() {
    setShowSwitchPanel(true);
  }

  return (
    <div className="lp-admin-account">
      <DropdownMenu
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setShowSwitchPanel(false);
        }}
      >
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="lp-admin-user lp-admin-user-trigger"
            aria-label="Open profile menu"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <UserAvatar name={name} imageUrl={avatarUrl} className="lp-avatar small" />
            <div>
              <b>{name}</b>
              <span>{roleLabel}</span>
            </div>
            <ChevronDown size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={10}
          collisionPadding={12}
          className={`lp-admin-account-popover ${showSwitchPanel ? "has-switch-panel" : ""}`}
        >
          <button type="button" className="lp-admin-account-summary" onClick={openSwitcher}>
            <UserAvatar name={name} imageUrl={avatarUrl} className="lp-avatar small" />
            <span className="lp-admin-account-summary-copy">
              <b>{name}</b>
              <small>{email}</small>
              <small>{roleLabel}</small>
            </span>
            <ChevronRight size={15} />
          </button>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/profile" className="lp-admin-account-action">
              <UserCircle size={15} />
              Manage account
            </Link>
          </DropdownMenuItem>
          <button type="button" className="lp-admin-account-action" onClick={openSwitcher}>
            <Users size={15} />
            Switch account
          </button>
          {settingsHref ? (
            <DropdownMenuItem asChild>
              <Link href={settingsHref} className="lp-admin-account-action">
                <Settings size={15} />
                Settings
              </Link>
            </DropdownMenuItem>
          ) : null}
          <form action="/api/auth/logout" method="post" className="lp-dropdown-form">
            <LogoutSubmitButton className="lp-admin-account-action" iconSize={15} />
          </form>
          {showSwitchPanel ? (
            <section className="lp-admin-account-switch-panel" aria-label="Switch account panel">
              <header>
                <p>Current account</p>
                <b>{email}</b>
              </header>
              <div className="lp-admin-account-switch-list">
                {accounts.map((account, index) => (
                  index === 0 ? (
                    <button key={account.id} type="button" className="lp-admin-account-row active">
                      <UserAvatar name={account.name} imageUrl={account.avatarUrl} className="lp-avatar small" />
                      <span className="lp-admin-account-row-copy">
                        <b>{account.name}</b>
                        <small>{account.email}</small>
                        <i>{account.roleLabel}</i>
                      </span>
                      <Check size={15} />
                    </button>
                  ) : (
                    <form action="/api/account-connections/switch" method="post" key={account.id}>
                      <input type="hidden" name="profileId" value={account.id} />
                      <button type="submit" className="lp-admin-account-row">
                        <UserAvatar name={account.name} imageUrl={account.avatarUrl} className="lp-avatar small" />
                        <span className="lp-admin-account-row-copy">
                          <b>{account.name}</b>
                          <small>{account.email}</small>
                          <i>Sign in to switch - {account.roleLabel}</i>
                        </span>
                        <ChevronRight size={15} />
                      </button>
                    </form>
                  )
                ))}
                <form action="/api/account-connections/connect" method="post">
                  <button type="submit" className="lp-admin-account-row lp-admin-account-row-add">
                    <span className="lp-admin-account-add-icon"><Plus size={14} /></span>
                    <span className="lp-admin-account-row-copy">
                      <b>Connect another account</b>
                      <small>Sign in once to link another profile</small>
                    </span>
                  </button>
                </form>
              </div>
            </section>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
