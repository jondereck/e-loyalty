import { POINTS_PER_VISIT } from "@/lib/constants";
import { safeTokenPreview } from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import { evaluateVisitEligibility } from "@/lib/rules";
import { getCurrentProfile } from "@/lib/services/session";
import { businessDayWindow } from "@/lib/time";

export type ScanPayload = {
  qrToken: string;
  branchId?: string;
  suspicious?: boolean;
};

export async function scanCustomerQr(payload: ScanPayload) {
  const cashier = await getCurrentProfile();
  if (!cashier) throw new Error("Not authenticated.");
  if (!cashier.roles.includes("CASHIER") && !cashier.roles.includes("BRANCH_ADMIN") && !cashier.roles.includes("SUPER_ADMIN")) {
    throw new Error("Only staff can scan QR codes.");
  }

  const assignment = payload.branchId
    ? cashier.staffAssignments.find((item) => item.branchId === payload.branchId && item.status === "ACTIVE")
    : cashier.staffAssignments.find((item) => item.status === "ACTIVE");
  const branchId = payload.branchId ?? assignment?.branchId;

  const [card, branch] = await Promise.all([
    prisma.loyaltyCard.findUnique({
      where: { qrToken: payload.qrToken },
      include: { profile: true },
    }),
    branchId ? prisma.branch.findUnique({ where: { id: branchId } }) : null,
  ]);

  const { start, end } = businessDayWindow();
  const approvedToday = card
    ? await prisma.visit.findFirst({
        where: {
          loyaltyCardId: card.id,
          status: { in: ["AUTO_APPROVED", "APPROVED"] },
          scannedAt: { gte: start, lt: end },
        },
      })
    : null;

  const approvedOtherBranchToday = Boolean(approvedToday && approvedToday.branchId !== branchId);
  const result = evaluateVisitEligibility({
    qrFound: Boolean(card),
    cardStatus: card?.status,
    customerStatus: card?.profile.status,
    branchStatus: branch?.status,
    cashierAssigned: Boolean(
      cashier.roles.includes("SUPER_ADMIN") ||
        (assignment && assignment.branchId === branchId && assignment.status === "ACTIVE"),
    ),
    approvedVisitToday: Boolean(approvedToday),
    approvedOtherBranchToday,
    suspicious: payload.suspicious,
  });

  if (!card || !branch || result.outcome === "BLOCKED") {
    const attempt = await prisma.scanAttempt.create({
      data: {
        qrTokenHash: safeTokenPreview(payload.qrToken),
        loyaltyCardId: card?.id,
        branchId: branch?.id,
        cashierId: cashier.id,
        status: "REJECTED",
        reasonCode: result.outcome === "BLOCKED" ? result.reasonCode : "SYSTEM_ERROR",
        message: scanMessage(result.outcome === "BLOCKED" ? result.reasonCode : "SYSTEM_ERROR"),
        nextEligibleAt: result.outcome === "BLOCKED" ? result.nextEligibleAt : null,
      },
    });

    return {
      type: "BLOCKED" as const,
      id: attempt.id,
      reasonCode: attempt.reasonCode,
      message: attempt.message,
      nextEligibleAt: attempt.nextEligibleAt,
    };
  }

  if (result.outcome === "PENDING") {
    const visit = await prisma.visit.create({
      data: {
        loyaltyCardId: card.id,
        customerId: card.profileId,
        branchId: branch.id,
        cashierId: cashier.id,
        status: "PENDING",
        approvalStatus: "REQUIRED",
        reasonCode: result.reasonCode,
        reason: scanMessage(result.reasonCode),
      },
    });

    await prisma.scanAttempt.create({
      data: {
        qrTokenHash: safeTokenPreview(payload.qrToken),
        loyaltyCardId: card.id,
        branchId: branch.id,
        cashierId: cashier.id,
        status: "PENDING",
        reasonCode: result.reasonCode,
        message: scanMessage(result.reasonCode),
      },
    });

    return { type: "PENDING" as const, id: visit.id, message: "Scan needs admin approval." };
  }

  const visit = await prisma.$transaction(async (tx) => {
    const created = await tx.visit.create({
      data: {
        loyaltyCardId: card.id,
        customerId: card.profileId,
        branchId: branch.id,
        cashierId: cashier.id,
        status: "AUTO_APPROVED",
        approvalStatus: "NOT_REQUIRED",
        pointsAwarded: POINTS_PER_VISIT,
        approvedAt: new Date(),
      },
    });

    await tx.pointLedger.create({
      data: {
        loyaltyCardId: card.id,
        profileId: card.profileId,
        visitId: created.id,
        type: "EARN",
        points: POINTS_PER_VISIT,
        description: "Approved visit earn",
      },
    });

    await tx.loyaltyCard.update({
      where: { id: card.id },
      data: {
        pointsBalance: { increment: POINTS_PER_VISIT },
        totalEarned: { increment: POINTS_PER_VISIT },
        visitsEarned: { increment: 1 },
        lastVisitAt: created.scannedAt,
      },
    });

    await tx.scanAttempt.create({
      data: {
        qrTokenHash: safeTokenPreview(payload.qrToken),
        loyaltyCardId: card.id,
        branchId: branch.id,
        cashierId: cashier.id,
        status: "AUTO_APPROVED",
        message: "Visit approved.",
      },
    });

    return created;
  });

  return {
    type: "AUTO_APPROVED" as const,
    id: visit.id,
    message: `Visit approved. ${POINTS_PER_VISIT} points added.`,
  };
}

export async function getScanResult(id: string) {
  const visit = await prisma.visit.findUnique({
    where: { id },
    include: { customer: true, branch: true, cashier: true },
  });
  if (visit) return { kind: "visit" as const, visit };

  const attempt = await prisma.scanAttempt.findUnique({
    where: { id },
    include: { branch: true, loyaltyCard: { include: { profile: true } } },
  });
  return attempt ? { kind: "attempt" as const, attempt } : null;
}

export function scanMessage(reasonCode?: string | null) {
  switch (reasonCode) {
    case "QR_NOT_FOUND":
    case "INVALID_QR":
      return "Invalid QR code.";
    case "CARD_BLOCKED":
    case "CARD_INACTIVE":
      return "This loyalty card cannot earn right now.";
    case "CUSTOMER_INACTIVE":
      return "Customer account is not active.";
    case "BRANCH_INACTIVE":
      return "Branch is not active for scanning.";
    case "UNAUTHORIZED_CASHIER":
      return "Cashier is not assigned to this branch.";
    case "ALREADY_USED_OTHER_BRANCH":
      return "Customer already earned at another branch today.";
    case "DUPLICATE_SAME_DAY":
      return "Customer already earned today.";
    case "SUSPICIOUS_ACTIVITY":
      return "Scan requires admin review.";
    case "MANUAL_REVIEW_REQUIRED":
      return "Manual review is required.";
    default:
      return "Scan could not be approved.";
  }
}

