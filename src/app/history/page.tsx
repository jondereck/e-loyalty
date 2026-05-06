import { AppNav } from "@/components/AppNav";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { VisitHistory } from "@/components/loyalty/VisitHistory";
import { getCustomerHistory } from "@/lib/services/customer";
import { requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const profile = await requireProfile(["CUSTOMER"]);
  const { visits, ledger, redemptions } = await getCustomerHistory(profile.id);

  return (
    <>
      <AppNav active="history" />
      <main className="container section">
        <div className="grid two" style={{ alignItems: "start" }}>
          <PhoneFrame active="history">
            <h3>History</h3>
            <div className="list">
              {visits.slice(0, 5).map((visit) => (
                <div className="row" key={visit.id}>
                  <div><strong>{visit.branch.name}</strong><br /><span className="muted">{visit.status.replaceAll("_", " ")}</span></div>
                  <span className="badge purple">{visit.pointsAwarded} pts</span>
                </div>
              ))}
            </div>
          </PhoneFrame>
          <section>
            <div className="eyebrow">Customer</div>
            <h2>Visit history</h2>
            <div className="actions" style={{ marginBottom: 18 }}>
              {["all", "approved", "pending", "rejected"].map((filter) => <span className="pill active" key={filter}>{filter}</span>)}
            </div>
            <VisitHistory visits={visits} />
            <div className="grid two" style={{ marginTop: 18 }}>
              <div className="card"><h3>Ledger entries</h3><p className="muted">{ledger.length} point events recorded.</p></div>
              <div className="card"><h3>Redemptions</h3><p className="muted">{redemptions.length} reward events recorded.</p></div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}

