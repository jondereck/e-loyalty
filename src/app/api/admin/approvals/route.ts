import { NextResponse } from "next/server";
import { approveVisitFormAction, rejectVisitFormAction } from "@/lib/services/admin";
import type { AdminMutationResult } from "@/lib/admin/mutations";
import { canAccessModule } from "@/lib/rbac";
import { getCurrentProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await forbiddenUnlessApprovalAccess();
  if (denied) return denied;
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const result = intent === "reject"
    ? await rejectVisitFormAction(formData)
    : await approveVisitFormAction(formData);
  return mutationResponse(result);
}

function mutationResponse(result: AdminMutationResult) {
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

async function forbiddenUnlessApprovalAccess() {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "ACTIVE") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(profile, "APPROVALS")) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  return null;
}
