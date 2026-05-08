import { NextResponse } from "next/server";
import {
  createStaffAccountFormAction,
  createStaffAssignmentFormAction,
  deleteStaffAccountFormAction,
  removeStaffAssignmentFormAction,
  updateStaffAssignmentFormAction,
  updateStaffAssignmentStatusFormAction,
} from "@/lib/services/admin";
import type { AdminMutationResult } from "@/lib/admin/mutations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const result = intent === "assign-existing"
    ? await createStaffAssignmentFormAction(formData)
    : await createStaffAccountFormAction(formData);
  return mutationResponse(result);
}

export async function PATCH(request: Request) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const result = intent === "status"
    ? await updateStaffAssignmentStatusFormAction(formData)
    : await updateStaffAssignmentFormAction(formData);
  return mutationResponse(result);
}

export async function DELETE(request: Request) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const result = intent === "delete-account"
    ? await deleteStaffAccountFormAction(formData)
    : await removeStaffAssignmentFormAction(formData);
  return mutationResponse(result);
}

function mutationResponse(result: AdminMutationResult) {
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
