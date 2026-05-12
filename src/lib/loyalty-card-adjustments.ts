export type ManualAdjustmentResult = {
  nextBalance: number;
  nextTotalEarned: number;
};

export function applyManualPointAdjustment({
  currentBalance,
  currentTotalEarned,
  delta,
}: {
  currentBalance: number;
  currentTotalEarned: number;
  delta: number;
}): ManualAdjustmentResult {
  const nextBalance = currentBalance + delta;

  if (nextBalance < 0) {
    throw new Error("Point adjustment cannot make the balance negative.");
  }

  return {
    nextBalance,
    nextTotalEarned: Math.max(0, currentTotalEarned + delta),
  };
}
