import { AdminShell } from "@/components/admin/AdminShell";
import { ApprovalTable } from "@/components/admin/ApprovalTable";
import { listPendingApprovals } from "@/lib/services/admin";
import { branchIdsForAdmin, requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function AdminApprovalsPage() {
  const profile = await requireProfile(["BRANCH_ADMIN", "SUPER_ADMIN"]);
  const visits = await listPendingApprovals(branchIdsForAdmin(profile));

  return (
    <AdminShell active="/admin/approvals">
      <div className="lp-page-title">
        <h1>Approvals</h1>
        <p>Review pending scans before points are awarded.</p>
      </div>
      <ApprovalTable visits={visits} />
    </AdminShell>
  );
}

