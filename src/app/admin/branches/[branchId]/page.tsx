import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getBranchDetail } from "@/lib/services/admin";
import { requireBranchScopedProfile } from "@/lib/services/session";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBranchDetailPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  await requireBranchScopedProfile(branchId);
  const branch = await getBranchDetail(branchId).catch(() => null);
  if (!branch) notFound();

  return (
    <AdminShell active="/admin/branches">
      <div className="lp-page-title">
        <h1>{branch.name}</h1>
        <p>Branch detail and recent activity.</p>
      </div>
      <div className="lp-metrics compact">
        <div className="lp-metric"><div><small>Code</small><b>{branch.code}</b><span className="up">Branch code</span></div></div>
        <div className="lp-metric"><div><small>Visits</small><b>{branch._count.visits}</b><span className="up">All time</span></div></div>
        <div className="lp-metric"><div><small>Status</small><StatusBadge status={branch.status} /></div></div>
      </div>
      <div className="lp-panel">
        <h3>Assigned staff</h3>
        <div className="lp-table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {branch.staffAssignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{assignment.profile.fullName}</td>
                  <td>{assignment.role.replaceAll("_", " ")}</td>
                  <td><StatusBadge status={assignment.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="lp-panel" style={{ marginTop: 18 }}>
        <h3>Recent activity</h3>
        <div className="lp-activity">
          {branch.visits.map((visit) => (
            <div className="lp-activity-item" key={visit.id}>
              <span>{formatDateTime(visit.scannedAt)}</span>
              <div><b>{visit.id.slice(0, 8)}</b><br /><span>Visit</span></div>
              <StatusBadge status={visit.status} />
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

