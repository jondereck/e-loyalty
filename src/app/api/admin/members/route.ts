import { NextResponse } from "next/server";
import {
  adjustMemberPointsFormAction,
  updateMemberCardStatusFormAction,
  updateMemberProfileStatusFormAction,
} from "@/lib/services/admin";
import type { AdminMutationResult } from "@/lib/admin/mutations";
import { canAccessModule } from "@/lib/rbac";
import { getCurrentProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await forbiddenUnlessMemberAccess();
  if (denied) return denied;
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const result = intent === "card-status"
    ? await updateMemberCardStatusFormAction(formData)
    : intent === "profile-status"
      ? await updateMemberProfileStatusFormAction(formData)
      : await adjustMemberPointsFormAction(formData);
  return mutationResponse(result);
}

function mutationResponse(result: AdminMutationResult) {
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

async function forbiddenUnlessMemberAccess() {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "ACTIVE") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(profile, "MEMBERS")) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  return null;
}
