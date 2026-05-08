import { NextResponse } from "next/server";
import {
  createBranchFormAction,
  deleteBranchFormAction,
  updateBranchFormAction,
} from "@/lib/services/admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const result = await createBranchFormAction({}, await request.formData());
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function PATCH(request: Request) {
  const result = await updateBranchFormAction({}, await request.formData());
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}

export async function DELETE(request: Request) {
  const result = await deleteBranchFormAction({}, await request.formData());
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
