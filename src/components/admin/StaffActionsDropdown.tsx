"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { MoreHorizontal, Trash2, UserMinus } from "lucide-react";
import { AdminMutationForm, AdminPlainSubmitButton } from "@/components/admin/AdminMutationForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

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
          <DropdownMenuItem key={nextStatus} disabled={status === nextStatus} onSelect={(event) => event.preventDefault()}>
            <AdminMutationForm action="/api/admin/staff" method="PATCH" className="lp-dropdown-form">
              <input type="hidden" name="intent" value="status" />
              <input type="hidden" name="assignmentId" value={assignmentId} />
              <input type="hidden" name="status" value={nextStatus} />
              <AdminPlainSubmitButton
                className={`lp-staff-menu-button ${nextStatus.toLowerCase()}`}
                disabled={status === nextStatus}
                pendingLabel={<span>Saving...</span>}
              >
                <span>{statusLabel(nextStatus)}</span>
                {status === nextStatus ? <em>Current</em> : null}
              </AdminPlainSubmitButton>
            </AdminMutationForm>
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
          <AdminMutationForm
            action="/api/admin/staff"
            method="DELETE"
            className="lp-dropdown-form"
            confirm={{
              title: "Remove staff assignment?",
              description: `Remove ${profileName}'s assignment from this branch?`,
              confirmLabel: "Remove assignment",
              cancelLabel: "Cancel",
              variant: "danger",
            }}
          >
            <input type="hidden" name="intent" value="remove-assignment" />
            <input type="hidden" name="assignmentId" value={assignmentId} />
            <AdminPlainSubmitButton className="lp-staff-menu-button warning" pendingLabel={<span>Removing...</span>}>
              <UserMinus size={15} />
              <span>Remove assignment</span>
            </AdminPlainSubmitButton>
          </AdminMutationForm>
        </DropdownMenuItem>

        {canDeleteAccount ? (
          <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
            <AdminMutationForm
              action="/api/admin/staff"
              method="DELETE"
              className="lp-dropdown-form"
              confirm={{
                title: "Delete staff account?",
                description: `Delete ${profileName}'s staff account? This cannot be undone.`,
                confirmLabel: "Delete account",
                cancelLabel: "Cancel",
                variant: "danger",
              }}
            >
              <input type="hidden" name="intent" value="delete-account" />
              <input type="hidden" name="profileId" value={profileId} />
              <AdminPlainSubmitButton className="lp-staff-menu-button danger" pendingLabel={<span>Deleting...</span>}>
                <Trash2 size={15} />
                <span>Delete account</span>
              </AdminPlainSubmitButton>
            </AdminMutationForm>
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
