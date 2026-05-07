import Link from "next/link";
import { AdminShell } from "@/components/admin/AdminShell";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { listMembers } from "@/lib/services/admin";
import { branchIdsForAdmin, requireProfile } from "@/lib/services/session";
import { compactNumber, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const profile = await requireProfile(["BRANCH_ADMIN", "SUPER_ADMIN"]);
  const { members, metrics } = await listMembers(branchIdsForAdmin(profile));

  return (
    <AdminShell active="/admin/members">
      <div className="lp-page-title">
        <h1>Members</h1>
        <p>Customer loyalty accounts, cards, points, and visit activity.</p>
      </div>
      <div className="lp-metrics">
        <MemberMetric label="Total Members" value={metrics.total} sub="Customer accounts" />
        <MemberMetric label="Active Members" value={metrics.active} sub="Can use loyalty pass" />
        <MemberMetric label="Blocked Cards" value={metrics.blockedCards} sub="Blocked from scans" />
        <MemberMetric label="Total Points" value={metrics.totalPoints} sub="Current balances" />
      </div>
      <div className="lp-panel">
        <h3>Customer Members</h3>
        <div className="lp-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Card</th>
                <th>Points</th>
                <th>Visits</th>
                <th>Last Visit</th>
                <th>Profile</th>
                <th>Card Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td><Link href={`/admin/members/${member.id}`}><strong>{member.fullName}</strong></Link></td>
                  <td>{member.mobile ?? member.email}</td>
                  <td>{member.loyaltyCard?.cardNumber ?? "No card"}</td>
                  <td>{compactNumber(member.loyaltyCard?.pointsBalance ?? 0)}</td>
                  <td>{compactNumber(member._count.visits)}</td>
                  <td>{formatDateTime(member.visits[0]?.scannedAt)}</td>
                  <td><StatusBadge status={member.status} /></td>
                  <td><StatusBadge status={member.loyaltyCard?.status} /></td>
                </tr>
              ))}
              {!members.length ? (
                <tr>
                  <td colSpan={8}>No customer members found for your admin scope.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
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
