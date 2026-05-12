import { AdminShell } from "@/components/admin/AdminShell";
import { getReportData } from "@/lib/services/reports";
import { requireModuleAccess, branchIdsForAdmin } from "@/lib/services/session";
import { ExportButton } from "@/components/admin/ExportButton";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { VisitTrendChart, PointsChart } from "@/components/admin/AnalyticsCharts";
import { getVisitAnalytics } from "@/lib/services/admin";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const profile = await requireModuleAccess("REPORTS");
  const branchIds = branchIdsForAdmin(profile);
  const params = await searchParams;

  const reportData = await getReportData({
    branchIds,
    dateFrom: params.from,
    dateTo: params.to,
  });

  const analytics = await getVisitAnalytics(branchIds);

  const visitColumns = [
    { label: "Date", key: "scannedAt" },
    { label: "Customer", key: "customer.fullName" },
    { label: "Branch", key: "branch.name" },
    { label: "Points", key: "pointsAwarded" },
    { label: "Status", key: "status" },
  ];

  return (
    <AdminShell active="/admin/reports" title="Branch Reports">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Reports & Analytics</h2>
            <p className="text-muted-foreground">
              Performance overview for your assigned branches.
            </p>
          </div>
          <ExportButton
            data={reportData.visits}
            filename="branch_visits"
            columns={visitColumns}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Total Visits"
            value={reportData.visits.length}
          />
          <MetricCard
            label="Points Issued"
            value={reportData.totalPointsEarned}
          />
          <MetricCard
            label="Redemptions"
            value={reportData.redemptions.length}
          />
          <MetricCard
            label="Avg. Points/Visit"
            value={reportData.visits.length ? Math.round(reportData.totalPointsEarned / reportData.visits.length) : 0}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Visit Trends</h3>
            <VisitTrendChart data={analytics} />
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Points Distribution</h3>
            <PointsChart data={analytics} />
          </Card>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="p-6 border-b">
            <h3 className="font-semibold">Recent Activity Log</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Branch</th>
                  <th className="px-6 py-3">Points</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reportData.visits.slice(0, 10).map((visit) => (
                  <tr key={visit.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-900">{visit.customer.fullName}</td>
                    <td className="px-6 py-4">{visit.branch.name}</td>
                    <td className="px-6 py-4">{visit.pointsAwarded}</td>
                    <td className="px-6 py-4">{new Date(visit.scannedAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                            visit.status === 'APPROVED' || visit.status === 'AUTO_APPROVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                            {visit.status}
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
