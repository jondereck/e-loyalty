import { Info, Sparkles } from "lucide-react";
import { CustomerShell } from "@/components/customer/CustomerShell";
import { RewardsTabs } from "@/components/loyalty/RewardsTabs";
import { getCustomerRewards } from "@/lib/services/customer";
import { requireProfile } from "@/lib/services/session";
import { compactNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const profile = await requireProfile(["CUSTOMER"]);
  const { card, rewards } = await getCustomerRewards(profile.id);
  const rewardItems = rewards.map((reward) => ({
    id: reward.id,
    name: reward.name,
    description: reward.description,
    pointsRequired: reward.pointsRequired,
    computedStatus: reward.computedStatus,
  }));

  return (
    <CustomerShell active="rewards" eyebrow="Milestones" title="Available rewards">
      <div className="lp-mobile-topbar">
        <h2>Rewards</h2>
        <Info size={20} />
      </div>

      <div className="lp-points-card">
        <div>
          <small>Your Points</small>
          <b>{compactNumber(card.pointsBalance)} pts</b>
        </div>
        <Sparkles size={30} />
      </div>

      <RewardsTabs pointsBalance={card.pointsBalance} rewards={rewardItems} />
    </CustomerShell>
  );
}
