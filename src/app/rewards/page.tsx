import { AppNav } from "@/components/AppNav";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { RewardCard } from "@/components/loyalty/RewardCard";
import { getCustomerRewards } from "@/lib/services/customer";
import { requireProfile } from "@/lib/services/session";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const profile = await requireProfile(["CUSTOMER"]);
  const { card, rewards } = await getCustomerRewards(profile.id);

  return (
    <>
      <AppNav active="rewards" />
      <main className="container section">
        <div className="grid two" style={{ alignItems: "start" }}>
          <PhoneFrame active="rewards">
            <h3>Rewards</h3>
            <div className="card">
              <strong>{card.tier}</strong>
              <p className="muted">{card.pointsBalance} points available</p>
            </div>
            <div className="list" style={{ marginTop: 14 }}>
              {rewards.slice(0, 4).map((reward) => (
                <div className="row" key={reward.id}>
                  <strong>{reward.name}</strong>
                  <span className="badge purple">{reward.computedStatus}</span>
                </div>
              ))}
            </div>
          </PhoneFrame>
          <section>
            <div className="eyebrow">Milestones</div>
            <h2>Available rewards</h2>
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
      </main>
    </>
  );
}

