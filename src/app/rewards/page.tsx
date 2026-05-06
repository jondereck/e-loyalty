import { CustomerShell } from "@/components/customer/CustomerShell";
import { RewardCard } from "@/components/loyalty/RewardCard";
import { getCustomerRewards } from "@/lib/services/customer";
import { requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const profile = await requireProfile(["CUSTOMER"]);
  const { card, rewards } = await getCustomerRewards(profile.id);

  return (
    <CustomerShell active="rewards" eyebrow="Milestones" title="Available rewards">
      <div className="customer-page-grid">
        <aside className="card customer-summary-card">
          <span className="tier">{card.tier}</span>
          <h2>{card.pointsBalance} pts</h2>
          <p className="muted">Points available for unlocked rewards.</p>
        </aside>
        <section>
          <div className="list">
            {rewards.map((reward) => (
              <RewardCard
                key={reward.id}
                name={reward.name}
                description={reward.description}
                pointsRequired={reward.pointsRequired}
                pointsCost={reward.pointsCost}
                status={reward.computedStatus}
              />
            ))}
          </div>
        </section>
      </div>
    </CustomerShell>
  );
}
