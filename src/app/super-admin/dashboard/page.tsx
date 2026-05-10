import { AdminShell } from "@/components/admin/AdminShell";
import { getAdminDashboard, getVisitAnalytics } from "@/lib/services/admin";
import { requireProfile } from "@/lib/services/session";
import { MetricCard } from "@/components/ui/MetricCard";
import { VisitTrendChart, PointsChart } from "@/components/admin/AnalyticsCharts";
import { Card } from "@/components/ui/Card";
import { Users, TrendingUp, LayoutGrid, Gift, Landmark, Activity } from "lucide-react";
import { formatTime } from "@/lib/utils";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  const profile = await requireProfile(["SUPER_ADMIN"]);
  const [dashboard, analytics, systemStats] = await Promise.all([
    getAdminDashboard(),
    getVisitAnalytics(),
    prisma.$transaction([
        prisma.branch.count(),
        prisma.rewardMilestone.count(),
        prisma.pointLedger.aggregate({
            _sum: { points: true }
        })
    ])
  ]);

  const [branchCount, rewardCount, pointsSum] = systemStats;

  return (
    <AdminShell active="/super-admin/dashboard" title="Super Admin Overview" showSuperAdmin>
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Platform Users"
            value={dashboard.totalUsers}
          />
          <MetricCard
            label="Global Visits Today"
            value={dashboard.visitsToday}
            badge={`${dashboard.approvedVisits} approved`}
          />
          <MetricCard
            label="System Points"
            value={pointsSum._sum.points ?? 0}
          />
          <MetricCard
            label="Active Branches"
            value={branchCount}
            badge={`${rewardCount} rewards`}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
                <h3 className="font-semibold mb-4">Platform Visit Trends</h3>
                <VisitTrendChart data={analytics} />
            </Card>
            <Card className="p-6">
                <h3 className="font-semibold mb-4">Global Points Activity</h3>
                <PointsChart data={analytics} />
            </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
            <Card className="md:col-span-2 p-0 overflow-hidden">
                <div className="p-6 border-b">
                    <h3 className="font-semibold">Branch Performance Network</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Branch</th>
                                <th className="px-6 py-3">Visits</th>
                                <th className="px-6 py-3">Staff</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {dashboard.branches.map((branch) => (
                                <tr key={branch.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{branch.name}</td>
                                    <td className="px-6 py-4">{branch._count.visits}</td>
                                    <td className="px-6 py-4">{branch._count.staffAssignments}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                                            branch.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                                        }`}>
                                            {branch.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Card className="p-0 overflow-hidden">
                <div className="p-6 border-b">
                    <h3 className="font-semibold">Recent System Audit</h3>
                </div>
                <div className="divide-y">
                    {dashboard.recentActivity.map((event) => (
                        <div key={event.id} className="p-4 flex gap-3 hover:bg-slate-50 transition-colors">
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <Activity size={14} className="text-slate-600" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate uppercase tracking-tight">
                                    {event.action.replaceAll("_", " ")}
                                </p>
                                <p className="text-[10px] text-slate-500">
                                    {event.actor?.fullName ?? "System"} • {formatTime(event.createdAt)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <Link href="/admin/dashboard" className="block w-full p-4 text-center text-xs font-semibold text-indigo-600 hover:bg-slate-50 border-t">
                    View detailed logs
                </Link>
            </Card>
        </div>
      </div>
    </AdminShell>
  );
}
