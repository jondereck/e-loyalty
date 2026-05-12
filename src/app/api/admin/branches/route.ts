import { NextResponse } from "next/server";
import {
  createBranchFormAction,
  deleteBranchFormAction,
  updateBranchFormAction,
} from "@/lib/services/admin";
import { canAccessModule } from "@/lib/rbac";
import { getCurrentProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = await forbiddenUnlessBranchAccess();
  if (denied) return denied;
  const result = await createBranchFormAction({}, await request.formData());
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function PATCH(request: Request) {
  const denied = await forbiddenUnlessBranchAccess();
  if (denied) return denied;
  const result = await updateBranchFormAction({}, await request.formData());
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function DELETE(request: Request) {
  const denied = await forbiddenUnlessBranchAccess();
  if (denied) return denied;
  const result = await deleteBranchFormAction({}, await request.formData());
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

async function forbiddenUnlessBranchAccess() {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "ACTIVE") return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  if (!canAccessModule(profile, "BRANCHES")) return NextResponse.json({ ok: false, message: "Forbidden" }, { status: 403 });
  return null;
}
