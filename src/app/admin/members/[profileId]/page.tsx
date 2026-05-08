import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { ArrowLeft, CreditCard, Mail, Phone, Shield, Star, TrendingUp, User, WalletCards } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdjustMemberPointsForm, MemberCardStatusForm, MemberProfileStatusActions } from "@/components/admin/MemberActions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getMemberDetail } from "@/lib/services/admin";
import { branchIdsForAdmin, requireProfile } from "@/lib/services/session";
import { compactNumber, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMemberDetailPage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const profile = await requireProfile(["BRANCH_ADMIN", "SUPER_ADMIN"]);
  const member = await getMemberDetail(profileId, branchIdsForAdmin(profile));
  if (!member) notFound();
  const card = member.loyaltyCard;

  return (
    <AdminShell active="/admin/members">
      <div className="lp-approval-detail-head">
        <Link href="/admin/members" className="lp-back-link"><ArrowLeft size={17} /> Back to Members</Link>
        <div className="lp-title-row lp-branch-hero">
          <div className="lp-page-title">
            <h1>{member.fullName}</h1>
            <p>Member profile, loyalty card, points, visits, and management actions.</p>
          </div>
          <div className="lp-title-actions">
            {card ? (
              <MemberCardStatusForm
                profileId={member.id}
                nextStatus={card.status === "BLOCKED" ? "ACTIVE" : "BLOCKED"}
                blocked={card.status === "BLOCKED"}
              />
            ) : null}
          </div>
        </div>
      </div>

      <div className="lp-member-metrics">
        <MemberMetric label="Points" value={card?.pointsBalance ?? 0} sub="Current balance" icon={<Star size={28} />} />
        <MemberMetric label="Visits" value={card?.visitsEarned ?? member._count.visits} sub="Earned visits" icon={<TrendingUp size={28} />} tone="green" />
        <MemberMetric label="Earned" value={card?.totalEarned ?? 0} sub="Lifetime points" icon={<WalletCards size={28} />} />
        <MemberMetric label="Redeemed" value={card?.totalRedeemed ?? 0} sub="Used points" icon={<CreditCard size={28} />} tone="orange" />
      </div>

      <div className="lp-approval-detail-grid">
        <section className="lp-panel lp-review-card">
          <h3><span className="lp-panel-icon"><User size={18} /></span> Member Profile</h3>
          <div className="lp-review-list">
            <ReviewRow icon={<User size={17} />} label="Name" value={member.fullName} />
            <ReviewRow icon={<Mail size={17} />} label="Email" value={member.email} />
            <ReviewRow icon={<Phone size={17} />} label="Mobile" value={member.mobile ?? "Not set"} />
            <ReviewRow icon={<Shield size={17} />} label="Username" value={member.username ?? "Not set"} />
            <ReviewRow icon={<Shield size={17} />} label="Profile Status" value="" badge={<StatusBadge status={member.status} />} />
            <ReviewRow icon={<TrendingUp size={17} />} label="Member Since" value={formatDateTime(member.createdAt)} />
          </div>
        </section>

        <section className="lp-panel lp-review-card">
          <h3><span className="lp-panel-icon"><CreditCard size={18} /></span> Loyalty Card</h3>
          <div className="lp-review-list">
            <ReviewRow icon={<CreditCard size={17} />} label="Card Number" value={card?.cardNumber ?? "No card"} />
            <ReviewRow icon={<Star size={17} />} label="Tier" value={card?.tier ?? "Not set"} />
            <ReviewRow icon={<Shield size={17} />} label="Card Status" value="" badge={<StatusBadge status={card?.status} />} />
            <ReviewRow icon={<TrendingUp size={17} />} label="Last Visit" value={formatDateTime(card?.lastVisitAt)} />
          </div>
        </section>
      </div>

      <div className="lp-approval-detail-grid">
        <section className="lp-panel lp-action-panel">
          <h3>Manage Member</h3>
          <MemberProfileStatusActions profileId={member.id} currentStatus={member.status} />
        </section>

        <section className="lp-panel lp-action-panel">
          <h3>Adjust Points</h3>
          {card ? (
            <AdjustMemberPointsForm profileId={member.id} />
          ) : (
            <p className="muted">This member does not have a loyalty card to adjust.</p>
          )}
        </section>
      </div>

      <div className="lp-approval-detail-grid">
        <HistoryTable title="Recent Visits" columns={["Time", "Branch", "Cashier", "Points", "Status"]}>
          {member.visits.map((visit) => (
            <tr key={visit.id}>
              <td>{formatDateTime(visit.scannedAt)}</td>
              <td>{visit.branch.name}</td>
              <td>{visit.cashier.fullName}</td>
              <td>{compactNumber(visit.pointsAwarded)}</td>
              <td><StatusBadge status={visit.status} /></td>
            </tr>
          ))}
          {!member.visits.length ? <tr><td colSpan={5}>No visits found.</td></tr> : null}
        </HistoryTable>

        <HistoryTable title="Point Ledger" columns={["Time", "Type", "Points", "Description"]}>
          {member.ledgerEntries.map((entry) => (
            <tr key={entry.id}>
              <td>{formatDateTime(entry.createdAt)}</td>
              <td>{entry.type}</td>
              <td>{compactNumber(entry.points)}</td>
              <td>{entry.description}</td>
            </tr>
          ))}
          {!member.ledgerEntries.length ? <tr><td colSpan={4}>No ledger entries found.</td></tr> : null}
        </HistoryTable>
      </div>

      <HistoryTable title="Redemptions" columns={["Time", "Reward", "Branch", "Status"]}>
        {member.redemptions.map((redemption) => (
          <tr key={redemption.id}>
            <td>{formatDateTime(redemption.createdAt)}</td>
            <td>{redemption.milestone.name}</td>
            <td>{redemption.branch?.name ?? "No branch"}</td>
            <td><StatusBadge status={redemption.status} /></td>
          </tr>
        ))}
        {!member.redemptions.length ? <tr><td colSpan={4}>No redemptions found.</td></tr> : null}
      </HistoryTable>
    </AdminShell>
  );
}

function MemberMetric({ label, value, sub, icon, tone = "purple" }: { label: string; value: number; sub: string; icon: ReactNode; tone?: "purple" | "green" | "orange" }) {
  return (
    <div className="lp-branch-metric">
      <span className={`lp-metric-icon ${tone}`}>{icon}</span>
      <div><small>{label}</small><b>{compactNumber(value)}</b><span>{sub}</span></div>
    </div>
  );
}

function ReviewRow({ icon, label, value, badge }: { icon: ReactNode; label: string; value: string; badge?: ReactNode }) {
  return <div className="lp-review-row">{icon}<span>{label}</span><strong>{badge ?? value}</strong></div>;
}

function HistoryTable({ title, columns, children }: { title: string; columns: string[]; children: ReactNode }) {
  return (
    <section className="lp-panel lp-admin-data-panel">
      <h3>{title}</h3>
      <div className="lp-table-wrap">
        <table>
          <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </section>
  );
}
