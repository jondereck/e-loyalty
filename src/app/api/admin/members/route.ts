import { NextResponse } from "next/server";
import {
  adjustMemberPointsFormAction,
  updateMemberCardStatusFormAction,
  updateMemberProfileStatusFormAction,
} from "@/lib/services/admin";
import type { AdminMutationResult } from "@/lib/admin/mutations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
