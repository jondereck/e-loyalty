import { CustomerShell } from "@/components/customer/CustomerShell";
import { VisitHistory } from "@/components/loyalty/VisitHistory";
import { getCustomerHistory } from "@/lib/services/customer";
import { requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const profile = await requireProfile(["CUSTOMER"]);
  const { visits, ledger, redemptions } = await getCustomerHistory(profile.id);

  return (
    <CustomerShell active="history" eyebrow="Customer" title="Visit history">
      <section>
        <div className="actions" style={{ marginBottom: 18 }}>
          {["all", "approved", "pending", "rejected"].map((filter) => <span className="pill active" key={filter}>{filter}</span>)}
        </div>
        <VisitHistory visits={visits} />
        <div className="grid two" style={{ marginTop: 18 }}>
          <div className="card"><h3>Ledger entries</h3><p className="muted">{ledger.length} point events recorded.</p></div>
          <div className="card"><h3>Redemptions</h3><p className="muted">{redemptions.length} reward events recorded.</p></div>
        </div>
      </section>
    </CustomerShell>
  );
}
