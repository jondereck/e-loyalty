import { NextResponse } from "next/server";
import { approveVisitFormAction, rejectVisitFormAction } from "@/lib/services/admin";
import type { AdminMutationResult } from "@/lib/admin/mutations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
