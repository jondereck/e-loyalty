import { AdminShell } from "@/components/admin/AdminShell";
import { MetricCard } from "@/components/ui/MetricCard";
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
      <div className="eyebrow">Super Admin</div>
      <h2>Platform control</h2>
      <div className="grid four">
        <MetricCard label="Total Users" value={users} />
        <MetricCard label="Total Visits" value={visits} />
        <MetricCard label="Branches" value={branches} />
        <MetricCard label="Pending" value={pending} />
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h3>Reward usage</h3>
        <p className="muted">{redemptions} reward redemptions recorded.</p>
      </div>
    </AdminShell>
  );
}

