import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { approveVisitAction, getApprovalDetail, rejectVisitAction } from "@/lib/services/admin";
import { requireBranchScopedProfile } from "@/lib/services/session";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminApprovalDetailPage({
  params,
}: {
  params: Promise<{ visitId: string }>;
}) {
  const { visitId } = await params;
  const data = await getApprovalDetail(visitId).catch(() => null);
  if (!data) notFound();
  await requireBranchScopedProfile(data.visit.branchId);

  return (
    <AdminShell active="/admin/approvals">
      <div className="lp-page-title">
        <h1>{data.visit.customer.fullName}</h1>
        <p>Approval detail for {data.visit.branch.name}</p>
      </div>
      <div className="lp-detail-grid">
        <div className="lp-panel lp-padded-panel">
          <h3>Scan summary</h3>
          <div className="lp-admin-detail-list">
            <div><span>Customer</span><strong>{data.visit.customer.fullName}</strong></div>
            <div><span>Branch</span><strong>{data.visit.branch.name}</strong></div>
            <div><span>Cashier</span><strong>{data.visit.cashier.fullName}</strong></div>
            <div><span>Scan time</span><strong>{formatDateTime(data.visit.scannedAt)}</strong></div>
            <div><span>Status</span><StatusBadge status={data.visit.status} /></div>
            <div><span>Conflict</span><strong>{data.visit.reasonCode?.replaceAll("_", " ") ?? "Manual review"}</strong></div>
          </div>
        </div>
        <div className="lp-panel lp-padded-panel">
          <h3>Decision</h3>
          <p className="muted">Approving creates one point-ledger entry and updates the loyalty card summary.</p>
          <form action={approveVisitAction} className="actions">
            <input type="hidden" name="visitId" value={data.visit.id} />
            <Button variant="success" type="submit">Approve</Button>
          </form>
          <form action={rejectVisitAction} style={{ marginTop: 18 }}>
            <input type="hidden" name="visitId" value={data.visit.id} />
            <div className="field">
              <label htmlFor="reason">Reject reason</label>
              <textarea id="reason" name="reason" placeholder="Reason for rejection" />
            </div>
            <Button variant="danger" type="submit">Reject</Button>
          </form>
        </div>
      </div>
      <div className="lp-detail-grid">
        <div className="lp-panel lp-padded-panel">
          <h3>Previous same-day attempt</h3>
          <p className="muted">
            {data.previous ? `${data.previous.branch.name} - ${formatDateTime(data.previous.scannedAt)} - ${data.previous.status}` : "No previous same-day attempt found."}
          </p>
        </div>
        <div className="lp-panel lp-padded-panel">
          <h3>Audit trail</h3>
          <div className="lp-admin-detail-list">
            {data.visit.auditEvents.map((event) => (
              <div key={event.id}><span>{event.action}</span><strong>{formatDateTime(event.createdAt)}</strong></div>
            ))}
            {!data.visit.auditEvents.length ? <p className="muted">No audit events yet.</p> : null}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

