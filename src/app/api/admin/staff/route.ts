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
import { canAccessModule } from "@/lib/rbac";
import { getCurrentProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await forbiddenUnlessStaffAccess();
  if (denied) return denied;
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const result = intent === "assign-existing"
    ? await createStaffAssignmentFormAction(formData)
    : await createStaffAccountFormAction(formData);
  return mutationResponse(result);
}

export async function PATCH(request: Request) {
  const denied = await forbiddenUnlessStaffAccess();
  if (denied) return denied;
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const result = intent === "status"
    ? await updateStaffAssignmentStatusFormAction(formData)
    : await updateStaffAssignmentFormAction(formData);
  return mutationResponse(result);
}

export async function DELETE(request: Request) {
  const denied = await forbiddenUnlessStaffAccess();
  if (denied) return denied;
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

async function forbiddenUnlessStaffAccess() {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "ACTIVE") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(profile, "STAFF")) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  return null;
}
