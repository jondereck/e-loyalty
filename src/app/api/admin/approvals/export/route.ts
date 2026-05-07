import { NextResponse } from "next/server";
import { getApprovalExportRows } from "@/lib/services/admin";
import { branchIdsForAdmin, getCurrentProfile } from "@/lib/services/session";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile || profile.status !== "ACTIVE") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!profile.roles.some((role) => role === "BRANCH_ADMIN" || role === "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const rows = await getApprovalExportRows({
    branchIds: branchIdsForAdmin(profile),
    status: readStatus(url.searchParams.get("status")),
    query: url.searchParams.get("q") ?? undefined,
    dateFrom: url.searchParams.get("from") ?? undefined,
    dateTo: url.searchParams.get("to") ?? undefined,
  });
  const csv = [
    ["Scan Time", "Member", "Card Number", "Branch", "Cashier", "Conflict", "Status", "Reason", "Admin Note"].join(","),
    ...rows.map((visit) => [
      formatDateTime(visit.scannedAt),
      visit.customer.fullName,
      visit.customer.loyaltyCard?.cardNumber ?? "",
      visit.branch.name,
      visit.cashier.fullName,
      visit.reasonCode?.replaceAll("_", " ") ?? "",
      visit.status,
      visit.reason ?? "",
      visit.adminNote ?? "",
    ].map(csvValue).join(",")),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="approvals-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function readStatus(value: string | null) {
  return value === "pending" || value === "approved" || value === "rejected" ? value : "all";
}

function csvValue(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
