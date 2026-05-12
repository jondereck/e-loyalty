import { describe, expect, it } from "vitest";
import { applyManualPointAdjustment } from "../lib/loyalty-card-adjustments";
import { getEffectiveTierPoints, getTierDetails } from "../lib/tiers";
import type { SettingsTier } from "../lib/services/settings";

const tiers: SettingsTier[] = [
  { name: "Starter", threshold: 0, multiplier: 1.0, color: "#7a50ff" },
  { name: "Silver", threshold: 1000, multiplier: 1.1, color: "#94a3b8" },
  { name: "Gold", threshold: 5000, multiplier: 1.2, color: "#eab308" },
];

describe("manual point adjustments", () => {
  it("promotes tier when a positive adjustment crosses a threshold", () => {
    const result = applyManualPointAdjustment({
      currentBalance: 900,
      currentTotalEarned: 900,
      delta: 200,
    });

    expect(result).toEqual({
      nextBalance: 1100,
      nextTotalEarned: 1100,
    });
    expect(getTierDetails(result.nextTotalEarned, tiers).tier).toBe("Silver");
  });

  it("demotes tier when a negative adjustment crosses below a threshold", () => {
    const result = applyManualPointAdjustment({
      currentBalance: 1200,
      currentTotalEarned: 1200,
      delta: -300,
    });

    expect(result).toEqual({
      nextBalance: 900,
      nextTotalEarned: 900,
    });
    expect(getTierDetails(result.nextTotalEarned, tiers).tier).toBe("Starter");
  });

  it("rejects negative adjustments that would make the balance negative", () => {
    expect(() =>
      applyManualPointAdjustment({
        currentBalance: 100,
        currentTotalEarned: 100,
        delta: -101,
      }),
    ).toThrow("Point adjustment cannot make the balance negative.");
  });

  it("clamps lifetime earned at zero on large negative adjustments", () => {
    const result = applyManualPointAdjustment({
      currentBalance: 100,
      currentTotalEarned: 25,
      delta: -25,
    });

    expect(result).toEqual({
      nextBalance: 75,
      nextTotalEarned: 0,
    });
    expect(getTierDetails(result.nextTotalEarned, tiers).tier).toBe("Starter");
  });

  it("uses the higher balance value for legacy tier display when lifetime earned is stale", () => {
    const effectivePoints = getEffectiveTierPoints(0, 2500);

    expect(effectivePoints).toBe(2500);
    expect(getTierDetails(effectivePoints, tiers).tier).toBe("Silver");
  });
});
