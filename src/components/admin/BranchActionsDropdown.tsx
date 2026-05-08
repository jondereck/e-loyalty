"use client";

import Link from "next/link";
import { Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { AdminMutationForm, AdminPlainSubmitButton } from "@/components/admin/AdminMutationForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";

type BranchActionCounts = {
  visits?: number;
  staffAssignments?: number;
  scanAttempts?: number;
  redemptions?: number;
};

export function BranchActionsDropdown({
  branchId,
  branchName,
  counts,
  canDelete,
}: {
  branchId: string;
  branchName: string;
  counts?: BranchActionCounts;
  canDelete: boolean;
}) {
  const deleteBlockReason = branchDeleteBlockReason(counts);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="lp-row-menu-trigger" aria-label={`Manage ${branchName}`}>
        <MoreHorizontal size={18} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="lp-staff-actions-menu">
        <DropdownMenuItem asChild>
          <Link className="lp-staff-menu-button inactive" href={`/admin/branches/${branchId}`}>
            <Eye size={15} />
            <span>View details</span>
          </Link>
        </DropdownMenuItem>

        {canDelete ? (
          <>
            <DropdownMenuSeparator />
            {deleteBlockReason ? (
              <DropdownMenuItem disabled>
                <button type="button" className="lp-staff-menu-button danger" disabled title={deleteBlockReason}>
                  <Trash2 size={15} />
                  <span>Delete branch</span>
                  <em>{deleteBlockReason}</em>
                </button>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
                <AdminMutationForm
                  action="/api/admin/branches"
                  method="DELETE"
                  className="lp-dropdown-form"
                  confirm={`Delete ${branchName}? This cannot be undone.`}
                >
                  <input type="hidden" name="branchId" value={branchId} />
                  <AdminPlainSubmitButton className="lp-staff-menu-button danger" pendingLabel={<span>Deleting...</span>}>
                    <Trash2 size={15} />
                    <span>Delete branch</span>
                  </AdminPlainSubmitButton>
                </AdminMutationForm>
              </DropdownMenuItem>
            )}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function branchDeleteBlockReason(counts?: BranchActionCounts) {
  if ((counts?.staffAssignments ?? 0) > 0) return "Remove staff first";
  if ((counts?.visits ?? 0) > 0 || (counts?.scanAttempts ?? 0) > 0 || (counts?.redemptions ?? 0) > 0) {
    return "Has activity";
  }
  return null;
}
