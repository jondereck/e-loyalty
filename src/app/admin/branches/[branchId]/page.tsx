import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Edit3, Gift, Info, Mail, MapPin, Phone, TrendingUp, Users } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { DeleteBranchForm, UpdateBranchForm } from "@/components/admin/BranchForms";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getBranchDetail } from "@/lib/services/admin";
import { requireBranchScopedProfile } from "@/lib/services/session";
import { compactNumber, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminBranchDetailPage({
  params,
}: {
  params: Promise<{ branchId: string }>;
}) {
  const { branchId } = await params;
  const profile = await requireBranchScopedProfile(branchId);
  const data = await getBranchDetail(branchId).catch(() => null);
  if (!data) notFound();
  const { branch, performance } = data;
  const canDelete = profile.roles.includes("SUPER_ADMIN");

  return (
    <AdminShell active="/admin/branches">
      <div className="lp-branch-detail-head">
        <Link href="/admin/branches" className="lp-back-link"><ArrowLeft size={17} /> Back to Branches</Link>
        <div className="lp-title-row lp-branch-hero">
          <div className="lp-page-title">
            <h1>Branch Details</h1>
            <p>View comprehensive information and performance for this branch.</p>
          </div>
          <div className="lp-title-actions">
            <Modal title="Edit branch" trigger={<Button type="button" variant="primary"><Edit3 size={17} /> Edit Branch</Button>}>
              <UpdateBranchForm branch={branch} />
            </Modal>
            {canDelete ? (
              <Modal title="Delete branch" trigger={<Button type="button" variant="danger">Delete Branch</Button>}>
                <DeleteBranchForm branch={branch} />
              </Modal>
            ) : null}
          </div>
        </div>
      </div>

      <div className="lp-branch-detail-grid">
        <section className="lp-panel lp-branch-info-panel">
          <h3><span className="lp-panel-icon"><Info size={17} /></span> Branch Information</h3>
          <div className="lp-branch-info-list">
            <DetailRow icon={<MapPin size={17} />} label="Branch Name" value={branch.name} />
            <DetailRow icon={<Info size={17} />} label="Branch Code" value={branch.code} />
            <DetailRow icon={<MapPin size={17} />} label="Address" value={branch.address || "Not provided"} multiline />
            <DetailRow icon={<Phone size={17} />} label="Phone" value={branch.phone || "Not provided"} />
            <DetailRow icon={<Mail size={17} />} label="Email" value={branch.email || "Not provided"} />
            <div className="lp-branch-info-row">
              <CheckCircle2 size={17} />
              <span>Status</span>
              <strong><StatusBadge status={branch.status} /></strong>
            </div>
          </div>
        </section>

        <section className="lp-panel lp-branch-performance-panel">
          <h3>
            <span className="lp-panel-icon"><TrendingUp size={17} /></span> Branch Performance
            <span className="lp-period-pill">This Week</span>
          </h3>
          <div className="lp-performance-grid">
            <PerformanceCard label="Visits" value={performance.weeklyVisits} sub={`${signedPercent(performance.weeklyVisitDelta)} vs last week`} icon={<Users size={25} />} />
            <PerformanceCard label="Points Earned" value={performance.weeklyPointsEarned} sub="Approved visits only" icon={<TrendingUp size={25} />} tone="orange" />
            <PerformanceCard label="Redemptions" value={performance.weeklyRedemptions} sub="This week" icon={<Gift size={25} />} />
            <PerformanceCard label="Redemption Rate" value={`${performance.redemptionRate}%`} sub="All time" icon={<TrendingUp size={25} />} tone="green" />
          </div>
        </section>
      </div>

      <section className="lp-panel lp-assigned-staff-panel">
        <h3>
          <span className="lp-panel-icon"><Users size={17} /></span> Assigned Staff
          <Link href="/admin/staff">View All Staff <ArrowRight size={15} /></Link>
        </h3>
        <div className="lp-staff-card-grid">
          {branch.staffAssignments.map((assignment) => (
            <div className="lp-staff-card" key={assignment.id}>
              <span className="lp-avatar small">{initials(assignment.profile.fullName)}</span>
              <div>
                <strong>{assignment.profile.fullName}</strong>
                <span>{assignment.profile.email}</span>
              </div>
              <em>{assignment.role.replaceAll("_", " ")}</em>
            </div>
          ))}
          {!branch.staffAssignments.length ? <p className="lp-empty-state">No staff assigned yet.</p> : null}
        </div>
      </section>

      <section className="lp-panel lp-recent-branch-panel">
        <h3>Recent Activity</h3>
        <div className="lp-table-wrap">
          <table>
            <thead><tr><th>Time</th><th>Member</th><th>Cashier</th><th>Points</th><th>Status</th></tr></thead>
            <tbody>
              {branch.visits.map((visit) => (
                <tr key={visit.id}>
                  <td>{formatDateTime(visit.scannedAt)}</td>
                  <td>{visit.customer.fullName}</td>
                  <td>{visit.cashier.fullName}</td>
                  <td>{visit.pointsAwarded.toLocaleString("en")}</td>
                  <td><StatusBadge status={visit.status} /></td>
                </tr>
              ))}
              {!branch.visits.length ? <tr><td colSpan={5}>No recent activity yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}

function DetailRow({
  icon,
  label,
  value,
  multiline = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="lp-branch-info-row">
      {icon}
      <span>{label}</span>
      <strong className={multiline ? "multiline" : ""}>{value}</strong>
    </div>
  );
}

function PerformanceCard({
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
    <div className="lp-performance-card">
      <div>
        <span>{label}</span>
        <b>{typeof value === "number" ? compactNumber(value) : value}</b>
        <small>{sub}</small>
      </div>
      <i className={`lp-metric-icon ${tone}`}>{icon}</i>
    </div>
  );
}

function signedPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value}%`;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "ST";
}
