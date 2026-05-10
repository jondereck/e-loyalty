import { TIER_THRESHOLDS, TIER_MULTIPLIERS, type TierName } from "./constants";

export function getTierDetails(totalEarned: number) {
  let currentTier: TierName = "STARTER";

  if (totalEarned >= TIER_THRESHOLDS.PLATINUM) {
    currentTier = "PLATINUM";
  } else if (totalEarned >= TIER_THRESHOLDS.GOLD) {
    currentTier = "GOLD";
  } else if (totalEarned >= TIER_THRESHOLDS.SILVER) {
    currentTier = "SILVER";
  }

  const multiplier = TIER_MULTIPLIERS[currentTier];

  let nextTier: TierName | null = null;
  let pointsToNext = 0;
  let progressPercentage = 100;

  if (currentTier === "STARTER") {
    nextTier = "SILVER";
    pointsToNext = TIER_THRESHOLDS.SILVER - totalEarned;
    progressPercentage = (totalEarned / TIER_THRESHOLDS.SILVER) * 100;
  } else if (currentTier === "SILVER") {
    nextTier = "GOLD";
    pointsToNext = TIER_THRESHOLDS.GOLD - totalEarned;
    const range = TIER_THRESHOLDS.GOLD - TIER_THRESHOLDS.SILVER;
    progressPercentage = ((totalEarned - TIER_THRESHOLDS.SILVER) / range) * 100;
  } else if (currentTier === "GOLD") {
    nextTier = "PLATINUM";
    pointsToNext = TIER_THRESHOLDS.PLATINUM - totalEarned;
    const range = TIER_THRESHOLDS.PLATINUM - TIER_THRESHOLDS.GOLD;
    progressPercentage = ((totalEarned - TIER_THRESHOLDS.GOLD) / range) * 100;
  }

  return {
    tier: currentTier,
    multiplier,
    nextTier,
    pointsToNext: Math.max(0, pointsToNext),
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
  };
}
