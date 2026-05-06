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
      <div className="eyebrow">Branch Detail</div>
      <h2>{branch.name}</h2>
      <div className="grid three">
        <div className="card metric"><span className="muted">Code</span><strong>{branch.code}</strong></div>
        <div className="card metric"><span className="muted">Visits</span><strong>{branch._count.visits}</strong></div>
        <div className="card metric"><span className="muted">Status</span><StatusBadge status={branch.status} /></div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h3>Assigned staff</h3>
        <table className="table">
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
      <div className="card" style={{ marginTop: 18 }}>
        <h3>Recent activity</h3>
        <div className="list">
          {branch.visits.map((visit) => (
            <div className="row" key={visit.id}>
              <span>{formatDateTime(visit.scannedAt)}</span>
              <StatusBadge status={visit.status} />
            </div>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}

