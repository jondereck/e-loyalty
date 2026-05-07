import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowLeft, Calendar, Check, Clock, CreditCard, FileText, MapPin, PackageCheck, ShieldCheck, User, X } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { POINTS_PER_VISIT } from "@/lib/constants";
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
  const visit = data.visit;
  const pending = visit.status === "PENDING";
  const points = visit.pointsAwarded || POINTS_PER_VISIT;

  return (
    <AdminShell active="/admin/approvals">
      <div className="lp-approval-detail-head">
        <Link href="/admin/approvals" className="lp-back-link"><ArrowLeft size={17} /> Back to Approvals</Link>
        <div className="lp-title-row lp-branch-hero">
          <div className="lp-page-title">
            <h1>Approval Detail</h1>
            <p>Review scan details and decide on approval.</p>
          </div>
          {pending ? (
            <div className="lp-title-actions">
              <form id="approve-visit-form" action={approveVisitAction}>
                <input type="hidden" name="visitId" value={visit.id} />
              </form>
              <form id="reject-visit-form" action={rejectVisitAction}>
                <input type="hidden" name="visitId" value={visit.id} />
                <input type="hidden" name="reason" value="Rejected by admin review" />
              </form>
              <Button form="approve-visit-form" variant="success" type="submit"><Check size={20} /> Approve</Button>
              <Button form="reject-visit-form" variant="danger" type="submit"><X size={20} /> Reject</Button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="lp-approval-detail-grid">
        <section className="lp-panel lp-review-card">
          <h3><span className="lp-panel-icon"><PackageCheck size={18} /></span> Scan Information</h3>
          <div className="lp-review-list">
            <ReviewRow icon={<Calendar size={17} />} label="Scan Time" value={formatDateTime(visit.scannedAt)} />
            <ReviewRow icon={<User size={17} />} label="Member" value={visit.customer.fullName} chip={`#${shortCode(visit.customerId)}`} />
            <ReviewRow icon={<CreditCard size={17} />} label="Card Number" value={maskCard(visit.customer.loyaltyCard?.cardNumber)} />
            <ReviewRow icon={<MapPin size={17} />} label="Branch" value={visit.branch.name} />
            <ReviewRow icon={<User size={17} />} label="Cashier" value={visit.cashier.fullName} chip={`#${shortCode(visit.cashierId)}`} />
            <ReviewRow icon={<FileText size={17} />} label="Order ID" value={`#${shortCode(visit.id)}`} />
            <ReviewRow icon={<ShieldCheck size={17} />} label="Points to be Earned" value={`+${points} pts`} strong />
          </div>
        </section>

        <section className="lp-panel lp-review-card">
          <h3><span className="lp-panel-icon"><ShieldCheck size={18} /></span> Scan Status</h3>
          <div className="lp-review-list compact">
            <ReviewRow icon={<ShieldCheck size={17} />} label="Status" value="" badge={<StatusBadge status={visit.status} />} />
            <ReviewRow icon={<AlertTriangle size={17} />} label="Conflict" value={conflictText(visit.reasonCode, visit.reason)} />
            <ReviewRow icon={<PackageCheck size={17} />} label="Scan Type" value="In-Store QR Scan" />
          </div>
          <div className="lp-history-box">
            <h4><Clock size={17} /> History</h4>
            <div className="lp-timeline">
              <TimelineItem active label={formatDateTime(visit.scannedAt)} detail={`Scan submitted by ${visit.cashier.fullName} (Cashier)`} />
              {data.previous ? <TimelineItem label={formatDateTime(data.previous.scannedAt)} detail={`Previous same-day attempt at ${data.previous.branch.name}`} /> : null}
              {visit.auditEvents.map((event) => (
                <TimelineItem key={event.id} label={formatDateTime(event.createdAt)} detail={`${event.action.replaceAll("_", " ")} by ${event.actor?.fullName ?? "System"}`} />
              ))}
              {pending ? <TimelineItem label={formatDateTime(visit.updatedAt)} detail="Marked as pending for admin review" /> : null}
            </div>
          </div>
        </section>
      </div>

      <section className="lp-panel lp-notes-panel">
        <h3><span className="lp-panel-icon"><FileText size={18} /></span> Notes</h3>
        <p>Add notes about this approval.</p>
        {pending ? (
          <div className="lp-note-grid">
            <label>
              Approval note
              <textarea name="adminNote" form="approve-visit-form" placeholder="Type your approval notes here..." maxLength={500} defaultValue={visit.adminNote ?? ""} />
            </label>
            <label>
              Reject reason and note
              <textarea name="reason" form="reject-visit-form" placeholder="Reason for rejection..." maxLength={500} defaultValue={visit.reason ?? ""} />
            </label>
          </div>
        ) : (
          <div className="lp-readonly-note">{visit.adminNote || visit.reason || "No notes recorded."}</div>
        )}
      </section>
    </AdminShell>
  );
}

function ReviewRow({ icon, label, value, chip, strong = false, badge }: { icon: ReactNode; label: string; value: string; chip?: string; strong?: boolean; badge?: ReactNode }) {
  return (
    <div className="lp-review-row">
      {icon}
      <span>{label}</span>
      <strong className={strong ? "points" : ""}>{badge ?? value}{chip ? <em>{chip}</em> : null}</strong>
    </div>
  );
}

function TimelineItem({ label, detail, active = false }: { label: string; detail: string; active?: boolean }) {
  return <div className={active ? "active" : ""}><i /><strong>{label}</strong><span>{detail}</span></div>;
}

function shortCode(value: string) {
  return value.slice(-5).toUpperCase();
}

function maskCard(value?: string | null) {
  if (!value) return "No card";
  return `**** **** **** ${value.slice(-4)}`;
}

function conflictText(reasonCode?: string | null, reason?: string | null) {
  return reasonCode?.replaceAll("_", " ").toLowerCase() || reason || "No conflict detected";
}
