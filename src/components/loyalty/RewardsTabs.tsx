"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { Gift, Tag } from "lucide-react";
import { compactNumber } from "@/lib/utils";

type RewardItem = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  computedStatus: string;
};

type RewardTab = "all" | "mine";

export function RewardsTabs({
  pointsBalance,
  rewards,
}: {
  pointsBalance: number;
  rewards: RewardItem[];
}) {
  const [activeTab, setActiveTab] = useState<RewardTab>("all");
  const visibleRewards = activeTab === "mine"
    ? rewards.filter((reward) => reward.computedStatus === "REDEEMED")
    : rewards;
  const emptyMessage = activeTab === "mine" ? "No redeemed rewards yet." : "No rewards available.";

  return (
    <>
      <div className="lp-segment" aria-label="Reward filter">
        <button
          type="button"
          className={activeTab === "all" ? "on" : undefined}
          aria-pressed={activeTab === "all"}
          onClick={() => setActiveTab("all")}
        >
          All Rewards
        </button>
        <button
          type="button"
          className={activeTab === "mine" ? "on" : undefined}
          aria-pressed={activeTab === "mine"}
          onClick={() => setActiveTab("mine")}
        >
          My Rewards
        </button>
      </div>

      <div className="lp-reward-list">
        {visibleRewards.map((reward, index) => {
          const percent = reward.computedStatus === "REDEEMED"
            ? 100
            : Math.min(100, Math.round((pointsBalance / Math.max(reward.pointsRequired, 1)) * 100));
          const Icon = index % 2 === 0 ? Gift : Tag;

          return (
            <div className="lp-reward-row" key={reward.id}>
              <span className="lp-soft-icon"><Icon size={22} /></span>
              <div>
                <h3>{reward.name}</h3>
                <p>{reward.description}</p>
                <b>{compactNumber(reward.pointsRequired)} pts</b>
              </div>
              <div className="lp-ring" style={{ "--p": `${percent}%` } as CSSProperties}>
                <span>{percent}%</span>
              </div>
            </div>
          );
        })}
        {!visibleRewards.length ? <div className="lp-mini-card lp-empty-card">{emptyMessage}</div> : null}
      </div>
    </>
  );
}
