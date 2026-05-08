"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { MoreHorizontal, Trash2, UserMinus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  deleteStaffAccountAction,
  removeStaffAssignmentAction,
  updateStaffAssignmentStatusAction,
} from "@/lib/services/admin";

type StaffStatus = "ACTIVE" | "INACTIVE" | "REVOKED";

type StaffActionsContextValue = {
  openAssignmentId: string | null;
  setOpenAssignmentId: (assignmentId: string | null) => void;
};

const StaffActionsContext = createContext<StaffActionsContextValue | null>(null);

export function StaffActionsProvider({ children }: { children: ReactNode }) {
  const [openAssignmentId, setOpenAssignmentId] = useState<string | null>(null);
  return (
    <StaffActionsContext.Provider value={{ openAssignmentId, setOpenAssignmentId }}>
      {children}
    </StaffActionsContext.Provider>
  );
}

export function StaffActionsDropdown({
  assignmentId,
  profileId,
  profileName,
  status,
  canDeleteAccount,
  deleteAccountReason,
}: {
  assignmentId: string;
  profileId: string;
  profileName: string;
  status: StaffStatus;
  canDeleteAccount: boolean;
  deleteAccountReason?: string;
}) {
  const context = useContext(StaffActionsContext);
  if (!context) throw new Error("StaffActionsDropdown must be rendered inside StaffActionsProvider.");

  const isOpen = context.openAssignmentId === assignmentId;

  return (
    <DropdownMenu
      open={isOpen}
      onOpenChange={(open) => context.setOpenAssignmentId(open ? assignmentId : null)}
    >
      <DropdownMenuTrigger className="lp-row-menu-trigger" aria-label={`Manage ${profileName}`}>
        <MoreHorizontal size={18} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="lp-staff-actions-menu">
        {(["ACTIVE", "INACTIVE", "REVOKED"] as const).map((nextStatus) => (
          <DropdownMenuItem key={nextStatus} asChild disabled={status === nextStatus}>
            <form action={updateStaffAssignmentStatusAction} className="lp-dropdown-form">
              <input type="hidden" name="assignmentId" value={assignmentId} />
              <input type="hidden" name="status" value={nextStatus} />
              <button
                type="submit"
                className={`lp-staff-menu-button ${nextStatus.toLowerCase()}`}
                disabled={status === nextStatus}
              >
                <span>{statusLabel(nextStatus)}</span>
                {status === nextStatus ? <em>Current</em> : null}
              </button>
            </form>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <form
            action={removeStaffAssignmentAction}
            className="lp-dropdown-form"
            onSubmit={(event) => {
              if (!window.confirm(`Remove ${profileName}'s assignment from this branch?`)) event.preventDefault();
            }}
          >
            <input type="hidden" name="assignmentId" value={assignmentId} />
            <button type="submit" className="lp-staff-menu-button warning">
              <UserMinus size={15} />
              <span>Remove assignment</span>
            </button>
          </form>
        </DropdownMenuItem>

        {canDeleteAccount ? (
          <DropdownMenuItem asChild>
            <form
              action={deleteStaffAccountAction}
              className="lp-dropdown-form"
              onSubmit={(event) => {
                if (!window.confirm(`Delete ${profileName}'s staff account? This cannot be undone.`)) event.preventDefault();
              }}
            >
              <input type="hidden" name="profileId" value={profileId} />
              <button type="submit" className="lp-staff-menu-button danger">
                <Trash2 size={15} />
                <span>Delete account</span>
              </button>
            </form>
          </DropdownMenuItem>
        ) : deleteAccountReason ? (
          <DropdownMenuItem disabled>
            <button type="button" className="lp-staff-menu-button danger" disabled title={deleteAccountReason}>
              <Trash2 size={15} />
              <span>Delete account</span>
              <em>{deleteAccountReason}</em>
            </button>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function statusLabel(status: StaffStatus) {
  if (status === "ACTIVE") return "Set active";
  if (status === "INACTIVE") return "Set inactive";
  return "Revoke";
}
