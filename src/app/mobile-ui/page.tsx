import { AppNav } from "@/components/AppNav";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { LoyaltyCard } from "@/components/loyalty/LoyaltyCard";

export default function MobileUiPage() {
  return (
    <>
      <AppNav />
      <main className="container section">
        <div className="eyebrow">Mobile UI</div>
        <h2>Customer phone preview</h2>
        <div className="grid two" style={{ alignItems: "center" }}>
          <PhoneFrame active="card">
            <LoyaltyCard tier="Gold" points={2480} visits={18} />
            <div className="row" style={{ marginTop: 14 }}><strong>Show My Pass</strong><span className="badge purple">QR</span></div>
          </PhoneFrame>
          <p className="lead">The production pages reuse this mobile frame style for customer card, history, rewards, and profile views.</p>
        </div>
      </main>
    </>
  );
}
