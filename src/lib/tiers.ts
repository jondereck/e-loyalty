import { defaultTiers, type TierSetting } from "./services/settings";

export function getTierDetails(totalEarned: number, config: TierSetting[] = defaultTiers) {
  // Sort tiers by threshold descending to find the current tier
  const sortedTiers = [...config].sort((a, b) => b.threshold - a.threshold);

  const currentTier = sortedTiers.find(t => totalEarned >= t.threshold) || sortedTiers[sortedTiers.length - 1];
  const currentIndex = config.findIndex(t => t.key === currentTier.key);

  const multiplier = currentTier.multiplier;
  const nextTier = config[currentIndex + 1] || null;

  let pointsToNext = 0;
  let progressPercentage = 100;

  if (nextTier) {
    pointsToNext = nextTier.threshold - totalEarned;
    const range = nextTier.threshold - currentTier.threshold;
    progressPercentage = ((totalEarned - currentTier.threshold) / range) * 100;
  }

  return {
    tier: currentTier.name,
    multiplier,
    nextTier: nextTier?.name || null,
    pointsToNext: Math.max(0, pointsToNext),
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
  };
}
