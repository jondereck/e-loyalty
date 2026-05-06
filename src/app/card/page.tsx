import { Gift, History, Maximize2, QrCode } from "lucide-react";
import { CustomerShell } from "@/components/customer/CustomerShell";
import { ButtonLink } from "@/components/ui/Button";
import { LoyaltyCard } from "@/components/loyalty/LoyaltyCard";
import { LoyaltyQR } from "@/components/loyalty/LoyaltyQR";
import { getCustomerCard } from "@/lib/services/customer";
import { requireProfile } from "@/lib/services/session";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CardPage() {
  const profile = await requireProfile(["CUSTOMER"]);
  const data = await getCustomerCard(profile.id);
  const progressTarget = data.nextReward?.pointsRequired ?? Math.max(data.card.pointsBalance, 1000);
  const progress = Math.min(100, Math.round((data.card.pointsBalance / progressTarget) * 100));

  return (
    <CustomerShell active="card" eyebrow="Customer Card" title={data.profile.fullName}>
      <div className="customer-page-grid customer-page-grid-main">
        <section className="customer-primary-stack">
          <LoyaltyCard tier={data.card.tier} points={data.card.pointsBalance} visits={data.card.visitsEarned} />
          <a href="#qr" className="row" style={{ marginTop: 14 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span className="icon"><QrCode size={20} /></span>
              <div>
                <strong>Show My Pass</strong>
                <br />
                <span className="muted">Open QR</span>
              </div>
            </div>
            <Maximize2 size={18} />
          </a>
          <div className="card" style={{ marginTop: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <strong>Next Reward</strong>
              <span className="badge purple">{data.nextReward?.pointsRequired ?? "Ready"} pts</span>
            </div>
            <p className="muted" style={{ fontSize: 13, margin: "6px 0" }}>
              {data.nextReward ? `${data.nextReward.pointsRequired - data.card.pointsBalance} pts to unlock` : "All seeded rewards are unlocked"}
            </p>
            <div className="progress" style={{ marginTop: 12 }}><span style={{ width: `${progress}%` }} /></div>
          </div>
        </section>
        <section className="customer-secondary-stack">
          <div className="grid two compact-grid">
            <div className="card">
              <strong>{data.todayEligibility}</strong>
              <p className="muted">
                {data.nextEligibleAt ? `Next eligible: ${formatDateTime(data.nextEligibleAt)}` : "Ready to earn at any active branch."}
              </p>
            </div>
            <div className="card">
              <strong>Last visit</strong>
              <p className="muted">
                {data.lastVisit ? `${data.lastVisit.branch.name} - ${formatDateTime(data.lastVisit.scannedAt)}` : "No approved visits yet."}
              </p>
            </div>
          </div>
          <div id="qr" className="card" style={{ marginTop: 24, textAlign: "center" }}>
            <h3>Customer QR</h3>
            <LoyaltyQR token={data.card.qrToken} />
            <p className="muted">Card number: {data.card.cardNumber}</p>
          </div>
          <div className="actions">
            <ButtonLink href="/history" variant="secondary"><History size={18} /> View history</ButtonLink>
            <ButtonLink href="/rewards" variant="secondary"><Gift size={18} /> View rewards</ButtonLink>
          </div>
        </section>
      </div>
    </CustomerShell>
  );
}
