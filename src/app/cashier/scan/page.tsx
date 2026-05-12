import { AppNav } from "@/components/AppNav";
import { QRScanner } from "@/components/cashier/QRScanner";
import { requireModuleAccess } from "@/lib/services/session";
import { prisma } from "@/lib/prisma";
import { resolveProfileModules, type RoleModuleKey } from "@/lib/rbac";
import { formatTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CashierScanPage() {
  const profile = await requireModuleAccess("SCAN");
  const activeAssignment = profile.staffAssignments.find((item) => item.status === "ACTIVE");
  const recent = await prisma.scanAttempt.findMany({
    where: { cashierId: profile.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
  const modules = resolveProfileModules(profile);
  const showAdmin = (["OVERVIEW", "MEMBERS", "APPROVALS", "STAFF", "BRANCHES", "REPORTS"] as RoleModuleKey[]).some((module) =>
    modules.has(module),
  );

  return (
    <>
      <AppNav active="cashier" mode="staff" showAdmin={showAdmin} />
      <main className="lp-staff-scan-page">
        <div className="lp-staff-scan-head">
          <div>
            <div className="eyebrow">Cashier</div>
            <h1>QR scan</h1>
            <p>{activeAssignment?.branch.name ?? "No active branch assignment"} - {profile.fullName}</p>
          </div>
        </div>
        <QRScanner
          branchId={activeAssignment?.branchId}
          recentScans={recent.map((scan) => ({
            id: scan.id,
            label: `${formatTime(scan.createdAt)} - ${scan.message}`,
            status: scan.status?.replaceAll("_", " ") ?? "BLOCKED",
          }))}
        />
      </main>
    </>
  );
}

