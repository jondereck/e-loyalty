import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, Gift, LayoutGrid, TrendingUp, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PointsChart, VisitTrendChart } from "@/components/admin/AnalyticsCharts";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdminDashboard, getVisitAnalytics, listPendingApprovals } from "@/lib/services/admin";
import { branchIdsForAdmin, requireProfile } from "@/lib/services/session";
import { compactNumber, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const profile = await requireProfile(["BRANCH_ADMIN", "SUPER_ADMIN"]);
  const branchIds = branchIdsForAdmin(profile);
  const [dashboard, pending, analytics] = await Promise.all([
    getAdminDashboard(branchIds),
    listPendingApprovals(branchIds),
    getVisitAnalytics(branchIds),
  ]);

  return (
    <AdminShell active="/admin/dashboard">
      <div className="lp-metrics">
        <AdminMetric label="Total Members" value={dashboard.customerUsers} sub={`${dashboard.staffUsers} staff users`} icon={<Users size={22} />} />
        <AdminMetric label="Visits Today" value={dashboard.visitsToday} sub={`${dashboard.approvedVisits} approved today`} icon={<TrendingUp size={22} />} />
        <AdminMetric label="Pending Reviews" value={dashboard.pendingApprovals} sub={`${dashboard.rejectedVisits} rejected today`} icon={<LayoutGrid size={22} />} tone="orange" />
        <AdminMetric label="Redemption Rate" value={`${dashboard.redemptionRate}%`} sub={`${dashboard.redemptions} redemptions`} icon={<Gift size={22} />} tone="green" />
      </div>

      <div className="lp-admin-grid">
        <section className="lp-panel span-6">
          <h3>Visit Trends (Last 30 Days)</h3>
          <div style={{ padding: "0 16px 16px" }}>
            <VisitTrendChart data={analytics} />
          </div>
        </section>

        <section className="lp-panel span-6">
          <h3>Points Distribution</h3>
          <div style={{ padding: "0 16px 16px" }}>
            <PointsChart data={analytics} />
          </div>
        </section>

        <section className="lp-panel span-4">
          <h3>Pending Scans</h3>
          <div className="lp-table-wrap">
            <table>
              <thead>
                <tr><th>Time</th><th>Member</th><th>Branch</th><th>Cashier</th><th>Status</th></tr>
              </thead>
              <tbody>
                {pending.slice(0, 5).map((visit) => (
                  <tr key={visit.id}>
                    <td><Link href={`/admin/approvals/${visit.id}`}>{formatTime(visit.scannedAt)}</Link></td>
                    <td>{visit.customer.fullName}</td>
                    <td>{visit.branch.name}</td>
                    <td>{visit.cashier.fullName}</td>
                    <td><StatusBadge status={visit.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Link className="lp-panel-foot" href="/admin/approvals">View all pending</Link>
        </section>

        <section className="lp-panel span-5">
          <h3>Branch Performance</h3>
          <div className="lp-table-wrap">
            <table>
              <thead>
                <tr><th>Branch</th><th>Visits</th><th>Staff</th><th>Activity</th></tr>
              </thead>
              <tbody>
                {dashboard.branches.map((branch) => {
                  const visits = branch._count.visits;
                  const width = Math.min(100, Math.max(10, visits));
                  return (
                    <tr key={branch.id}>
                      <td>{branch.name}</td>
                      <td>{compactNumber(visits)}</td>
                      <td>{branch._count.staffAssignments}</td>
                      <td><span className="lp-bar"><i style={{ width: `${width}%` }} /></span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Link className="lp-panel-foot" href="/admin/branches">View full report</Link>
        </section>

        <section className="lp-panel span-3">
          <h3>Recent Activity</h3>
          <div className="lp-activity">
            {dashboard.recentActivity.map((event) => (
              <div className="lp-activity-item" key={event.id}>
                <span><Activity size={15} /></span>
                <div><b>{event.action.replaceAll("_", " ")}</b><br /><span>{event.actor?.fullName ?? "System"}</span></div>
                <time>{formatTime(event.createdAt)}</time>
              </div>
            ))}
          </div>
          <span className="lp-panel-foot">View all activity</span>
        </section>
      </div>
    </AdminShell>
  );
}

function AdminMetric({
  label,
  value,
  sub,
  icon,
  tone = "purple",
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: ReactNode;
  tone?: "purple" | "green" | "orange";
}) {
  return (
    <div className="lp-metric">
      <div>
        <small>{label}</small>
        <b>{typeof value === "number" ? compactNumber(value) : value}</b>
        <span className={tone === "orange" ? "down" : "up"}>{sub}</span>
      </div>
      <span className={`lp-metric-icon ${tone}`}>{icon}</span>
    </div>
  );
}
