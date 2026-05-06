import { AdminShell } from "@/components/admin/AdminShell";
import { ApprovalTable } from "@/components/admin/ApprovalTable";
import { MetricCard } from "@/components/ui/MetricCard";
import { getAdminDashboard, listPendingApprovals } from "@/lib/services/admin";
import { requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const profile = await requireProfile(["BRANCH_ADMIN", "SUPER_ADMIN"]);
  const branchIds = profile.roles.includes("SUPER_ADMIN")
    ? undefined
    : profile.staffAssignments.filter((item) => item.role === "BRANCH_ADMIN" && item.status === "ACTIVE").map((item) => item.branchId);
  const [dashboard, pending] = await Promise.all([getAdminDashboard(), listPendingApprovals(branchIds)]);

  return (
    <AdminShell active="/admin/dashboard">
      <div className="eyebrow">Admin Dashboard</div>
      <h2>Overview</h2>
      <div className="grid four">
        <MetricCard label="Visits Today" value={dashboard.visitsToday} />
        <MetricCard label="Pending Reviews" value={dashboard.pendingApprovals} />
        <MetricCard label="Approved Visits" value={dashboard.approvedVisits} />
        <MetricCard label="Rejected Visits" value={dashboard.rejectedVisits} />
      </div>
      <div style={{ marginTop: 18 }}>
        <h3>Pending approvals</h3>
        <ApprovalTable visits={pending.slice(0, 8)} />
      </div>
    </AdminShell>
  );
}

