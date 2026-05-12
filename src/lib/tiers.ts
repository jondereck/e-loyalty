import type { SettingsTier } from "./services/settings";

export function getEffectiveTierPoints(totalEarned: number, pointsBalance: number) {
  return Math.max(totalEarned, pointsBalance);
}

export function getTierDetails(totalEarned: number, tiers: SettingsTier[]) {
  // Sort tiers by threshold descending to find the current tier
  const sortedTiers = [...tiers].sort((a, b) => b.threshold - a.threshold);

  const currentTierIndex = sortedTiers.findIndex(t => totalEarned >= t.threshold);
  const currentTier = currentTierIndex !== -1 ? sortedTiers[currentTierIndex] : tiers[0];

  const multiplier = currentTier.multiplier;

  // Next tier is the one just above the current threshold
  const ascendingTiers = [...tiers].sort((a, b) => a.threshold - b.threshold);
  const nextTierIndex = ascendingTiers.findIndex(t => t.threshold > currentTier.threshold);
  const nextTier = nextTierIndex !== -1 ? ascendingTiers[nextTierIndex] : null;

  let pointsToNext = 0;
  let progressPercentage = 100;

  if (nextTier) {
    pointsToNext = nextTier.threshold - totalEarned;
    const range = nextTier.threshold - currentTier.threshold;
    progressPercentage = range > 0
      ? ((totalEarned - currentTier.threshold) / range) * 100
      : 100;
  }

  return {
    tier: currentTier.name,
    color: currentTier.color,
    multiplier,
    nextTier: nextTier?.name ?? null,
    pointsToNext: Math.max(0, pointsToNext),
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
  };
}
