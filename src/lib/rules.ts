import { POINTS_PER_VISIT } from "@/lib/constants";
import { businessDayWindow } from "@/lib/time";

export type EligibilityInput = {
  qrFound: boolean;
  cardStatus?: "ACTIVE" | "BLOCKED";
  customerStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  branchStatus?: "ACTIVE" | "INACTIVE" | "MAINTENANCE";
  cashierAssigned: boolean;
  approvedVisitToday: boolean;
  approvedOtherBranchToday: boolean;
  suspicious?: boolean;
  pointsPerVisit?: number;
  multiplier?: number;
  now?: Date;
};

export type EligibilityResult =
  | { outcome: "AUTO_APPROVED"; points: number }
  | { outcome: "PENDING"; reasonCode: "SUSPICIOUS_ACTIVITY" | "MANUAL_REVIEW_REQUIRED" }
  | {
      outcome: "BLOCKED";
      reasonCode:
        | "QR_NOT_FOUND"
        | "CARD_BLOCKED"
        | "CARD_INACTIVE"
        | "CUSTOMER_INACTIVE"
        | "BRANCH_INACTIVE"
        | "UNAUTHORIZED_CASHIER"
        | "DUPLICATE_SAME_DAY"
        | "ALREADY_USED_OTHER_BRANCH";
      nextEligibleAt?: Date;
    };

export function evaluateVisitEligibility(input: EligibilityInput): EligibilityResult {
  if (!input.qrFound) return { outcome: "BLOCKED", reasonCode: "QR_NOT_FOUND" };
  if (input.cardStatus === "BLOCKED") return { outcome: "BLOCKED", reasonCode: "CARD_BLOCKED" };
  if (input.cardStatus !== "ACTIVE") return { outcome: "BLOCKED", reasonCode: "CARD_INACTIVE" };
  if (input.customerStatus !== "ACTIVE") return { outcome: "BLOCKED", reasonCode: "CUSTOMER_INACTIVE" };
  if (input.branchStatus !== "ACTIVE") return { outcome: "BLOCKED", reasonCode: "BRANCH_INACTIVE" };
  if (!input.cashierAssigned) return { outcome: "BLOCKED", reasonCode: "UNAUTHORIZED_CASHIER" };

  const { nextEligibleAt } = businessDayWindow(input.now);
  if (input.approvedOtherBranchToday) {
    return { outcome: "BLOCKED", reasonCode: "ALREADY_USED_OTHER_BRANCH", nextEligibleAt };
  }
  if (input.approvedVisitToday) {
    return { outcome: "BLOCKED", reasonCode: "DUPLICATE_SAME_DAY", nextEligibleAt };
  }
  if (input.suspicious) return { outcome: "PENDING", reasonCode: "SUSPICIOUS_ACTIVITY" };

  const basePoints = validPoints(input.pointsPerVisit);
  const multiplier = typeof input.multiplier === "number" && input.multiplier > 0 ? input.multiplier : 1;
  const points = Math.round(basePoints * multiplier);

  return { outcome: "AUTO_APPROVED", points };
}

export function rewardStatus(pointsBalance: number, pointsRequired: number, redeemed = false) {
  if (redeemed) return "REDEEMED";
  return pointsBalance >= pointsRequired ? "AVAILABLE" : "LOCKED";
}

function validPoints(points?: number) {
  return typeof points === "number" && Number.isInteger(points) && points > 0 ? points : POINTS_PER_VISIT;
}
