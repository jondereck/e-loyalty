import { notFound } from "next/navigation";
import { X } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { AutoCloseScanResult } from "@/components/cashier/AutoCloseScanResult";
import { ButtonLink } from "@/components/ui/Button";
import { ScanResultCard } from "@/components/cashier/ScanResultCard";
import { activeAssignmentsForRole, requireModuleAccess } from "@/lib/services/session";
import { getScanResult } from "@/lib/services/visits";
import { resolveProfileModules } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function CashierScanResultPage({
  params,
}: {
  params: Promise<{ visitId: string }>;
}) {
  const profile = await requireModuleAccess("SCAN");
  const { visitId } = await params;
  const result = await getScanResult(visitId);
  if (!result) notFound();
  const resultBranchId = result.kind === "visit" ? result.visit.branchId : result.attempt.branchId;
  const canAccess = profile.roles.includes("SUPER_ADMIN") ||
    Boolean(resultBranchId && activeAssignmentsForRole(profile, ["CASHIER", "BRANCH_ADMIN"]).some((item) => item.branchId === resultBranchId));
  if (!canAccess) notFound();
  const modules = resolveProfileModules(profile);

  const card =
    result.kind === "visit" ? (
      <ScanResultCard
        status={result.visit.status}
        title={result.visit.status.includes("APPROVED") ? "Eligible for Visit" : "Pending Review"}
        message={result.visit.reason ?? `${result.visit.pointsAwarded} points will be applied.`}
        customer={result.visit.customer.fullName}
        branch={result.visit.branch.name}
        scannedAt={result.visit.scannedAt}
        pointsAwarded={result.visit.pointsAwarded}
      />
    ) : (
      <ScanResultCard
        status="BLOCKED"
        title="Scan Blocked"
        message={result.attempt.message}
        customer={result.attempt.loyaltyCard?.profile.fullName}
        branch={result.attempt.branch?.name}
        scannedAt={result.attempt.createdAt}
        nextEligibleAt={result.attempt.nextEligibleAt}
      />
  );

  return (
    <AdminShell active="/cashier/scan">
      <section className="lp-scan-result-page">
        <div className="lp-scan-result-panel">
          <div className="lp-mobile-topbar">
            <h2>Scan Result</h2>
            <ButtonLink href="/cashier/scan" variant="secondary" className="lp-icon-link" aria-label="Close scan result">
              <X size={17} />
            </ButtonLink>
          </div>
          <AutoCloseScanResult />
          {card}
          <div className="lp-scan-actions">
            <ButtonLink href="/cashier/scan" variant="primary">Scan another</ButtonLink>
            {modules.has("APPROVALS") ? (
              <ButtonLink href="/admin/approvals" variant="secondary">Open approvals</ButtonLink>
            ) : null}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

