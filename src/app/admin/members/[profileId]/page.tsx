import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  adjustMemberPointsAction,
  getMemberDetail,
  updateMemberCardStatusAction,
  updateMemberProfileStatusAction,
} from "@/lib/services/admin";
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
      <div className="lp-page-title">
        <h1>{member.fullName}</h1>
        <p>Member profile, loyalty card, points, visits, and management actions.</p>
      </div>

      <div className="lp-metrics compact">
        <MemberMetric label="Points" value={card?.pointsBalance ?? 0} sub="Current balance" />
        <MemberMetric label="Visits" value={card?.visitsEarned ?? member._count.visits} sub="Earned visits" />
        <MemberMetric label="Earned" value={card?.totalEarned ?? 0} sub="Lifetime points" />
        <MemberMetric label="Redeemed" value={card?.totalRedeemed ?? 0} sub="Used points" />
      </div>

      <div className="lp-detail-grid">
        <section className="lp-panel lp-padded-panel">
          <h3>Member profile</h3>
          <div className="lp-admin-detail-list">
            <div><span>Name</span><strong>{member.fullName}</strong></div>
            <div><span>Email</span><strong>{member.email}</strong></div>
            <div><span>Mobile</span><strong>{member.mobile ?? "Not set"}</strong></div>
            <div><span>Username</span><strong>{member.username ?? "Not set"}</strong></div>
            <div><span>Profile status</span><StatusBadge status={member.status} /></div>
            <div><span>Member since</span><strong>{formatDateTime(member.createdAt)}</strong></div>
          </div>
        </section>

        <section className="lp-panel lp-padded-panel">
          <h3>Loyalty card</h3>
          <div className="lp-admin-detail-list">
            <div><span>Card number</span><strong>{card?.cardNumber ?? "No card"}</strong></div>
            <div><span>Tier</span><strong>{card?.tier ?? "Not set"}</strong></div>
            <div><span>Card status</span><StatusBadge status={card?.status} /></div>
            <div><span>Last visit</span><strong>{formatDateTime(card?.lastVisitAt)}</strong></div>
          </div>
        </section>
      </div>

      <div className="lp-detail-grid">
        <section className="lp-panel lp-padded-panel">
          <h3>Manage member</h3>
          <div className="actions">
            {card ? (
              <form action={updateMemberCardStatusAction}>
                <input type="hidden" name="profileId" value={member.id} />
                <input type="hidden" name="status" value={card.status === "BLOCKED" ? "ACTIVE" : "BLOCKED"} />
                <Button type="submit" variant={card.status === "BLOCKED" ? "success" : "danger"}>
                  {card.status === "BLOCKED" ? "Unblock Card" : "Block Card"}
                </Button>
              </form>
            ) : null}
            {(["ACTIVE", "INACTIVE", "SUSPENDED"] as const).map((status) => (
              <form action={updateMemberProfileStatusAction} key={status}>
                <input type="hidden" name="profileId" value={member.id} />
                <input type="hidden" name="status" value={status} />
                <Button type="submit" variant={member.status === status ? "secondary" : "default"} disabled={member.status === status}>
                  {status.replaceAll("_", " ")}
                </Button>
              </form>
            ))}
          </div>
        </section>

        <section className="lp-panel lp-padded-panel">
          <h3>Adjust points</h3>
          {card ? (
            <form action={adjustMemberPointsAction}>
              <input type="hidden" name="profileId" value={member.id} />
              <div className="field">
                <label htmlFor="points">Points</label>
                <input id="points" name="points" type="number" step="1" placeholder="100 or -50" />
              </div>
              <div className="field">
                <label htmlFor="reason">Reason</label>
                <textarea id="reason" name="reason" placeholder="Reason for adjustment" />
              </div>
              <Button type="submit" variant="primary">Save Adjustment</Button>
            </form>
          ) : (
            <p className="muted">This member does not have a loyalty card to adjust.</p>
          )}
        </section>
      </div>

      <div className="lp-detail-grid">
        <section className="lp-panel">
          <h3>Recent visits</h3>
          <div className="lp-table-wrap">
            <table>
              <thead><tr><th>Time</th><th>Branch</th><th>Cashier</th><th>Points</th><th>Status</th></tr></thead>
              <tbody>
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
              </tbody>
            </table>
          </div>
        </section>

        <section className="lp-panel">
          <h3>Point ledger</h3>
          <div className="lp-table-wrap">
            <table>
              <thead><tr><th>Time</th><th>Type</th><th>Points</th><th>Description</th></tr></thead>
              <tbody>
                {member.ledgerEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{formatDateTime(entry.createdAt)}</td>
                    <td>{entry.type}</td>
                    <td>{compactNumber(entry.points)}</td>
                    <td>{entry.description}</td>
                  </tr>
                ))}
                {!member.ledgerEntries.length ? <tr><td colSpan={4}>No ledger entries found.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="lp-panel">
        <h3>Redemptions</h3>
        <div className="lp-table-wrap">
          <table>
            <thead><tr><th>Time</th><th>Reward</th><th>Branch</th><th>Status</th></tr></thead>
            <tbody>
              {member.redemptions.map((redemption) => (
                <tr key={redemption.id}>
                  <td>{formatDateTime(redemption.createdAt)}</td>
                  <td>{redemption.milestone.name}</td>
                  <td>{redemption.branch?.name ?? "No branch"}</td>
                  <td><StatusBadge status={redemption.status} /></td>
                </tr>
              ))}
              {!member.redemptions.length ? <tr><td colSpan={4}>No redemptions found.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}

function MemberMetric({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="lp-metric">
      <div>
        <small>{label}</small>
        <b>{compactNumber(value)}</b>
        <span className="up">{sub}</span>
      </div>
    </div>
  );
}
