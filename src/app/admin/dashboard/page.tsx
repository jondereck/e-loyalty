import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, Gift, LayoutGrid, TrendingUp, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { PointsChart, VisitTrendChart } from "@/components/admin/AnalyticsCharts";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getAdminDashboard, getVisitAnalytics, listPendingApprovals } from "@/lib/services/admin";
import { branchIdsForAdmin, requireModuleAccess } from "@/lib/services/session";
import { compactNumber, formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const profile = await requireModuleAccess("OVERVIEW");
  const branchIds = branchIdsForAdmin(profile);
  const [dashboard, pending, analytics] = await Promise.all([
    getAdminDashboard(branchIds),
    listPendingApprovals(branchIds),
    getVisitAnalytics(branchIds),
  ]);

  return (
    <AdminShell active="/admin/dashboard">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Users size={24} />
            </div>
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Members</p>
                <h4 className="text-2xl font-bold text-slate-900">{compactNumber(dashboard.customerUsers)}</h4>
                <p className="text-[10px] text-slate-400 mt-1">{dashboard.staffUsers} staff users</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <TrendingUp size={24} />
            </div>
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Visits Today</p>
                <h4 className="text-2xl font-bold text-slate-900">{dashboard.visitsToday}</h4>
                <p className="text-[10px] text-emerald-600 mt-1">{dashboard.approvedVisits} approved today</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <LayoutGrid size={24} />
            </div>
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Pending Reviews</p>
                <h4 className="text-2xl font-bold text-slate-900">{dashboard.pendingApprovals}</h4>
                <p className="text-[10px] text-amber-600 mt-1">{dashboard.rejectedVisits} rejected today</p>
            </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                <Gift size={24} />
            </div>
            <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Redemption Rate</p>
                <h4 className="text-2xl font-bold text-slate-900">{dashboard.redemptionRate}%</h4>
                <p className="text-[10px] text-slate-400 mt-1">{dashboard.redemptions} redemptions</p>
            </div>
        </div>
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
