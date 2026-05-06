import { CustomerShell } from "@/components/customer/CustomerShell";
import { LoyaltyCard } from "@/components/loyalty/LoyaltyCard";

export default function MobileUiPage() {
  return (
    <CustomerShell active="card" eyebrow="Customer Card" title="Loyalty Pass">
      <div className="customer-page-grid customer-page-grid-main">
        <section className="customer-primary-stack">
          <LoyaltyCard tier="Gold" points={2480} visits={18} />
          <div className="row" style={{ marginTop: 14 }}><strong>Show My Pass</strong><span className="badge purple">QR</span></div>
        </section>
        <section className="card">
          <h3>Next Reward</h3>
          <p className="muted">520 pts to unlock</p>
          <div className="progress" style={{ marginTop: 16 }}><span style={{ width: "71%" }} /></div>
        </section>
      </div>
    </CustomerShell>
  );
}
