import { NextResponse } from "next/server";
import {
  createRoleAction,
  disableRoleAction,
  duplicateRoleAction,
  updateRolePermissionsAction,
} from "@/lib/services/roles";
import { requireProfile } from "@/lib/services/session";
import type { RoleFormInput, RoleUpdateInput } from "@/lib/validations/roles";

type RoleMutationPayload =
  | ({ action: "create" } & RoleFormInput)
  | ({ action: "update" } & RoleUpdateInput)
  | { action: "duplicate"; roleId: string }
  | { action: "disable"; roleId: string };

export async function POST(request: Request) {
  try {
    await requireProfile(["SUPER_ADMIN"]);
    const payload = await request.json() as RoleMutationPayload;

    if (payload.action === "create") {
      return NextResponse.json(await createRoleAction(payload));
    }

    if (payload.action === "update") {
      return NextResponse.json(await updateRolePermissionsAction(payload));
    }

    if (payload.action === "duplicate") {
      return NextResponse.json(await duplicateRoleAction({ roleId: payload.roleId }));
    }

    if (payload.action === "disable") {
      return NextResponse.json(await disableRoleAction({ roleId: payload.roleId }));
    }

    return NextResponse.json({ ok: false, message: "Unsupported role action." }, { status: 400 });
  } catch (error) {
    console.error("Role mutation request failed:", error);
    return NextResponse.json({ ok: false, message: "Role update failed. Please sign in again and retry." }, { status: 500 });
  }
}
