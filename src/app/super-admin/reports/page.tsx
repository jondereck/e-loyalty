import { AdminShell } from "@/components/admin/AdminShell";
import { getReportData } from "@/lib/services/reports";
import { requireBranchScopedProfile } from "@/lib/services/session";
import { ExportButton } from "@/components/admin/ExportButton";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { VisitTrendChart, PointsChart } from "@/components/admin/AnalyticsCharts";
import { getVisitAnalytics } from "@/lib/services/admin";
import { prisma } from "@/lib/prisma";

export default async function SuperAdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const profile = await requireBranchScopedProfile();
  if (!profile.roles.includes("SUPER_ADMIN")) {
      throw new Error("Access denied");
  }

  const params = await searchParams;

  const reportData = await getReportData({
    dateFrom: params.from,
    dateTo: params.to,
  });

  const analytics = await getVisitAnalytics();

  const branchPerformance = await prisma.branch.findMany({
      include: {
          _count: {
              select: { visits: true, redemptions: true }
          }
      }
  });

  const visitColumns = [
    { label: "Date", key: "scannedAt" },
    { label: "Customer", key: "customer.fullName" },
    { label: "Branch", key: "branch.name" },
    { label: "Points", key: "pointsAwarded" },
    { label: "Status", key: "status" },
  ];

  return (
    <AdminShell active="/super-admin/reports" title="Platform Analytics" showSuperAdmin>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">System-Wide Reports</h2>
            <p className="text-muted-foreground">
              Global overview of platform performance and branch metrics.
            </p>
          </div>
          <ExportButton
            data={reportData.visits}
            filename="system_all_visits"
            columns={visitColumns}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Platform Visits"
            value={reportData.visits.length}
          />
          <MetricCard
            label="Total Points Issued"
            value={reportData.totalPointsEarned}
          />
          <MetricCard
            label="Active Redemptions"
            value={reportData.redemptions.length}
          />
          <MetricCard
            label="Total Branches"
            value={branchPerformance.length}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Network Growth (Visits)</h3>
            <VisitTrendChart data={analytics} />
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Points Economy</h3>
            <PointsChart data={analytics} />
          </Card>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold">Branch Performance Ranking</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-3">Branch Name</th>
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3 text-center">Total Visits</th>
                  <th className="px-6 py-3 text-center">Redemptions</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {branchPerformance.map((branch) => (
                  <tr key={branch.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{branch.name}</td>
                    <td className="px-6 py-4 text-slate-500">{branch.code}</td>
                    <td className="px-6 py-4 text-center">{branch._count.visits}</td>
                    <td className="px-6 py-4 text-center">{branch._count.redemptions}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            branch.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
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
      </div>
    </AdminShell>
  );
}
