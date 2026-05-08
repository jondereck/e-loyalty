import { describe, expect, it } from "vitest";
import { evaluateVisitEligibility, rewardStatus } from "../lib/rules";
import { businessDayWindow } from "../lib/time";

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

describe("visit eligibility", () => {
  it("auto-approves a clean scan and awards fixed points", () => {
    expect(evaluateVisitEligibility(baseInput)).toEqual({ outcome: "AUTO_APPROVED", points: 100 });
  });

  it("auto-approves a clean scan with configured points", () => {
    expect(evaluateVisitEligibility({ ...baseInput, pointsPerVisit: 150 })).toEqual({ outcome: "AUTO_APPROVED", points: 150 });
  });

  it("blocks invalid qr, inactive card, inactive branch, and unauthorized cashier", () => {
    expect(evaluateVisitEligibility({ ...baseInput, qrFound: false })).toMatchObject({
      outcome: "BLOCKED",
      reasonCode: "QR_NOT_FOUND",
    });
    expect(evaluateVisitEligibility({ ...baseInput, cardStatus: "BLOCKED" })).toMatchObject({
      outcome: "BLOCKED",
      reasonCode: "CARD_BLOCKED",
    });
    expect(evaluateVisitEligibility({ ...baseInput, branchStatus: "INACTIVE" })).toMatchObject({
      outcome: "BLOCKED",
      reasonCode: "BRANCH_INACTIVE",
    });
    expect(evaluateVisitEligibility({ ...baseInput, cashierAssigned: false })).toMatchObject({
      outcome: "BLOCKED",
      reasonCode: "UNAUTHORIZED_CASHIER",
    });
  });

  it("blocks same-day duplicate and returns next eligible midnight in Asia/Taipei", () => {
    const result = evaluateVisitEligibility({ ...baseInput, approvedVisitToday: true });
    expect(result).toMatchObject({ outcome: "BLOCKED", reasonCode: "DUPLICATE_SAME_DAY" });
    if (result.outcome === "BLOCKED") {
      expect(result.nextEligibleAt?.toISOString()).toBe("2026-05-06T16:00:00.000Z");
    }
  });

  it("prioritizes other-branch same-day conflict", () => {
    expect(
      evaluateVisitEligibility({
        ...baseInput,
        approvedVisitToday: true,
        approvedOtherBranchToday: true,
      }),
    ).toMatchObject({ outcome: "BLOCKED", reasonCode: "ALREADY_USED_OTHER_BRANCH" });
  });

  it("routes suspicious scans to pending review", () => {
    expect(evaluateVisitEligibility({ ...baseInput, suspicious: true })).toEqual({
      outcome: "PENDING",
      reasonCode: "SUSPICIOUS_ACTIVITY",
    });
  });
});

describe("business day window", () => {
  it("uses Asia/Taipei midnight for eligibility windows", () => {
    const window = businessDayWindow(new Date("2026-05-06T01:14:00.000Z"));
    expect(window.start.toISOString()).toBe("2026-05-05T16:00:00.000Z");
    expect(window.nextEligibleAt.toISOString()).toBe("2026-05-06T16:00:00.000Z");
  });
});

describe("reward status", () => {
  it("computes locked, available, and redeemed states", () => {
    expect(rewardStatus(900, 1000)).toBe("LOCKED");
    expect(rewardStatus(1000, 1000)).toBe("AVAILABLE");
    expect(rewardStatus(1000, 1000, true)).toBe("REDEEMED");
  });
});
