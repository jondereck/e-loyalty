import { NextResponse } from "next/server";
import { getMemberExportRows } from "@/lib/services/admin";
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
  const rows = await getMemberExportRows({
    branchIds: branchIdsForAdmin(profile),
    query: url.searchParams.get("q") ?? undefined,
    status: readMemberStatus(url.searchParams.get("status")),
    branchId: url.searchParams.get("branchId") ?? undefined,
    cardStatus: readCardStatus(url.searchParams.get("cardStatus")),
    tier: url.searchParams.get("tier") ?? undefined,
  });
  const csv = [
    ["Name", "Email", "Mobile", "Card Number", "Tier", "Points", "Visits", "Last Visit", "Profile Status", "Card Status"].join(","),
    ...rows.map((member) => [
      member.fullName,
      member.email,
      member.mobile ?? "",
      member.loyaltyCard?.cardNumber ?? "",
      member.loyaltyCard?.tier ?? "",
      member.loyaltyCard?.pointsBalance ?? 0,
      member._count.visits,
      formatDateTime(member.visits[0]?.scannedAt),
      member.status,
      member.loyaltyCard?.status ?? "",
    ].map(csvValue).join(",")),
  ].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="members-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}

function readMemberStatus(value: string | null) {
  return value === "ACTIVE" || value === "INACTIVE" || value === "SUSPENDED" ? value : "all";
}

function readCardStatus(value: string | null) {
  return value === "ACTIVE" || value === "BLOCKED" ? value : "all";
}

function csvValue(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
