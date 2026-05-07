import { AdminShell } from "@/components/admin/AdminShell";
import { prisma } from "@/lib/prisma";
import { requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  await requireProfile(["SUPER_ADMIN"]);
  const [users, visits, branches, pending, redemptions] = await Promise.all([
    prisma.userProfile.count(),
    prisma.visit.count(),
    prisma.branch.count(),
    prisma.visit.count({ where: { status: "PENDING" } }),
    prisma.rewardRedemption.count(),
  ]);

  return (
    <AdminShell active="/super-admin/dashboard">
      <div className="lp-page-title">
        <h1>Platform control</h1>
        <p>Global loyalty system activity.</p>
      </div>
      <div className="lp-metrics">
        <div className="lp-metric"><div><small>Total Users</small><b>{users}</b><span className="up">All profiles</span></div></div>
        <div className="lp-metric"><div><small>Total Visits</small><b>{visits}</b><span className="up">All scans</span></div></div>
        <div className="lp-metric"><div><small>Branches</small><b>{branches}</b><span className="up">Locations</span></div></div>
        <div className="lp-metric"><div><small>Pending</small><b>{pending}</b><span className="down">Needs review</span></div></div>
      </div>
      <div className="lp-panel lp-padded-panel" style={{ marginTop: 18 }}>
        <h3>Reward usage</h3>
        <p className="muted">{redemptions} reward redemptions recorded.</p>
      </div>
    </AdminShell>
  );
}

