import { AdminShell } from "@/components/admin/AdminShell";
import { ApprovalTable } from "@/components/admin/ApprovalTable";
import { listPendingApprovals } from "@/lib/services/admin";
import { requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function AdminApprovalsPage() {
  const profile = await requireProfile(["BRANCH_ADMIN", "SUPER_ADMIN"]);
  const branchIds = profile.roles.includes("SUPER_ADMIN")
    ? undefined
    : profile.staffAssignments.filter((item) => item.role === "BRANCH_ADMIN" && item.status === "ACTIVE").map((item) => item.branchId);
  const visits = await listPendingApprovals(branchIds);

  return (
    <AdminShell active="/admin/approvals">
      <div className="eyebrow">Admin</div>
      <h2>Approvals</h2>
      <p className="lead">Review pending scans before points are awarded.</p>
      <ApprovalTable visits={visits} />
    </AdminShell>
  );
}

