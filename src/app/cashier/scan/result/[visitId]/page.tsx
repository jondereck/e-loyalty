import { notFound } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { ButtonLink } from "@/components/ui/Button";
import { ScanResultCard } from "@/components/cashier/ScanResultCard";
import { requireProfile } from "@/lib/services/session";
import { getScanResult } from "@/lib/services/visits";

export const dynamic = "force-dynamic";

export default async function CashierScanResultPage({
  params,
}: {
  params: Promise<{ visitId: string }>;
}) {
  await requireProfile(["CASHIER", "BRANCH_ADMIN", "SUPER_ADMIN"]);
  const { visitId } = await params;
  const result = await getScanResult(visitId);
  if (!result) notFound();

  const card =
    result.kind === "visit" ? (
      <ScanResultCard
        status={result.visit.status}
        title={result.visit.status.includes("APPROVED") ? "Visit approved" : "Pending review"}
        message={result.visit.reason ?? `${result.visit.pointsAwarded} points will be applied.`}
        customer={result.visit.customer.fullName}
        branch={result.visit.branch.name}
        scannedAt={result.visit.scannedAt}
      />
    ) : (
      <ScanResultCard
        status="BLOCKED"
        title="Scan blocked"
        message={result.attempt.message}
        customer={result.attempt.loyaltyCard?.profile.fullName}
        branch={result.attempt.branch?.name}
        scannedAt={result.attempt.createdAt}
        nextEligibleAt={result.attempt.nextEligibleAt}
      />
    );

  return (
    <>
      <AppNav active="cashier" />
      <main className="container section">
        <div className="grid two" style={{ alignItems: "start" }}>
          {card}
          <section>
            <div className="eyebrow">Scan result</div>
            <h2>Cashier outcome</h2>
            <p className="lead">Green proceeds, yellow waits for admin review, and red is blocked with the reason shown.</p>
            <div className="actions">
              <ButtonLink href="/cashier/scan" variant="primary">Scan another</ButtonLink>
              <ButtonLink href="/admin/approvals" variant="secondary">Open approvals</ButtonLink>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

