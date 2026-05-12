import { NextResponse } from "next/server";
import { getBranchExportRows } from "@/lib/services/admin";
import { branchIdsForAdmin, getCurrentProfile } from "@/lib/services/session";
import { canAccessModule } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "ACTIVE") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessModule(profile, "BRANCHES")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const rows = await getBranchExportRows(branchIdsForAdmin(profile), url.searchParams.get("q") ?? undefined);
  const csv = [
    ["Code", "Branch", "Address", "Phone", "Email", "Visits", "Staff", "Status"].join(","),
    ...rows.map((branch) =>
      [
        branch.code,
        branch.name,
        branch.address ?? "",
        branch.phone ?? "",
        branch.email ?? "",
        branch._count.visits,
        branch._count.staffAssignments,
        branch.status,
      ].map(csvValue).join(","),
    ),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="branches-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function csvValue(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
