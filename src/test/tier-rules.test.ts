import { describe, expect, it } from "vitest";
import { evaluateVisitEligibility } from "../lib/rules";

const baseInput = {
  qrFound: true,
  cardStatus: "ACTIVE" as const,
  customerStatus: "ACTIVE" as const,
  branchStatus: "ACTIVE" as const,
  cashierAssigned: true,
  approvedVisitToday: false,
  approvedOtherBranchToday: false,
  now: new Date("2026-05-06T01:14:00.000Z"),
};

describe("tier multiplier eligibility", () => {
  it("awards base points when no multiplier is provided", () => {
    expect(evaluateVisitEligibility(baseInput)).toEqual({ outcome: "AUTO_APPROVED", points: 100 });
  });

  it("awards multiplied points for Silver tier (1.1x)", () => {
    expect(evaluateVisitEligibility({ ...baseInput, multiplier: 1.1 })).toEqual({
      outcome: "AUTO_APPROVED",
      points: 110
    });
  });

  it("awards multiplied points for Gold tier (1.2x)", () => {
    expect(evaluateVisitEligibility({ ...baseInput, multiplier: 1.2 })).toEqual({
      outcome: "AUTO_APPROVED",
      points: 120
    });
  });

  it("awards multiplied points for Platinum tier (1.5x)", () => {
    expect(evaluateVisitEligibility({ ...baseInput, multiplier: 1.5 })).toEqual({
      outcome: "AUTO_APPROVED",
      points: 150
    });
  });

  it("rounds points correctly for fractional multipliers", () => {
    // 150 base * 1.1 = 165
    expect(evaluateVisitEligibility({ ...baseInput, pointsPerVisit: 150, multiplier: 1.1 })).toEqual({
      outcome: "AUTO_APPROVED",
      points: 165
    });

    // 100 base * 1.15 = 115
    expect(evaluateVisitEligibility({ ...baseInput, multiplier: 1.15 })).toEqual({
      outcome: "AUTO_APPROVED",
      points: 115
    });
  });
});
