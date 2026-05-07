import { POINTS_PER_VISIT } from "@/lib/constants";
import { Prisma, type VisitReasonCode, type VisitStatus } from "@/generated/prisma/client";
import { safeTokenPreview } from "@/lib/ids";
import { prisma } from "@/lib/prisma";
import { evaluateVisitEligibility } from "@/lib/rules";
import { activeAssignmentsForRole, getCurrentProfile } from "@/lib/services/session";
import { businessDayWindow, computeBusinessDate } from "@/lib/time";

export type ScanPayload = {
  qrToken: string;
  branchId?: string;
  suspicious?: boolean;
};

type AttemptDb = Pick<typeof prisma, "auditEvent" | "scanAttempt">;
type ResolvedCard = {
  id: string;
  profileId: string;
  profile: { status: string };
};

export const validateVisitEligibility = evaluateVisitEligibility;

export async function scanCustomerQr(payload: ScanPayload) {
  const cashier = await getCurrentProfile();
  if (!cashier) throw new Error("Not authenticated.");
  if (cashier.status !== "ACTIVE") throw new Error("Inactive users cannot scan QR codes.");
  if (!cashier.roles.includes("CASHIER") && !cashier.roles.includes("BRANCH_ADMIN") && !cashier.roles.includes("SUPER_ADMIN")) {
    throw new Error("Only staff can scan QR codes.");
  }

  const assignment = payload.branchId
    ? activeAssignmentsForRole(cashier, ["CASHIER", "BRANCH_ADMIN"]).find((item) => item.branchId === payload.branchId)
    : activeAssignmentsForRole(cashier, ["CASHIER", "BRANCH_ADMIN"])[0];
  const branchId = payload.branchId ?? assignment?.branchId;
  const now = new Date();
  const businessDate = computeBusinessDate(now);
  const { start, end, nextEligibleAt } = businessDayWindow(now);
  const qrTokenHash = safeTokenPreview(payload.qrToken);

  const [card, branch] = await Promise.all([
    prisma.loyaltyCard.findUnique({
      where: { qrToken: payload.qrToken },
      include: { profile: true },
    }),
    branchId ? prisma.branch.findUnique({ where: { id: branchId } }) : null,
  ]);

  const approvedToday = card
    ? await prisma.visit.findFirst({
        where: {
          loyaltyCardId: card.id,
          status: { in: ["AUTO_APPROVED", "APPROVED"] },
          OR: [
            { businessDate },
            { businessDate: "", scannedAt: { gte: start, lt: end } },
          ],
        },
      })
    : null;

  const approvedOtherBranchToday = Boolean(approvedToday && approvedToday.branchId !== branchId);
  const flags = await scanAttemptFlags({
    businessDate,
    cashierId: cashier.id,
    loyaltyCardId: card?.id,
    qrTokenHash,
    multipleBranchSameDay: approvedOtherBranchToday,
  });
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
    const reasonCode = result.outcome === "BLOCKED" ? result.reasonCode : "SYSTEM_ERROR";
    const attempt = await createVisitAttempt(prisma, {
      actorId: cashier.id,
      qrTokenHash,
      loyaltyCardId: card?.id,
      branchId: branch?.id,
      cashierId: cashier.id,
      status: "REJECTED",
      reasonCode,
      message: scanMessage(reasonCode),
      businessDate,
      flags,
      nextEligibleAt: result.outcome === "BLOCKED" ? result.nextEligibleAt : null,
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
    const visit = await prisma.$transaction(async (tx) => {
      const created = await tx.visit.create({
        data: {
          loyaltyCardId: card.id,
          customerId: card.profileId,
          branchId: branch.id,
          cashierId: cashier.id,
          status: "PENDING",
          approvalStatus: "REQUIRED",
          reasonCode: result.reasonCode,
          reason: scanMessage(result.reasonCode),
          businessDate,
        },
      });

      await createVisitAttempt(tx, {
        actorId: cashier.id,
        qrTokenHash,
        loyaltyCardId: card.id,
        branchId: branch.id,
        cashierId: cashier.id,
        status: "PENDING",
        reasonCode: result.reasonCode,
        message: scanMessage(result.reasonCode),
        businessDate,
        flags,
        visitId: created.id,
      });

      await tx.auditEvent.create({
        data: {
          actorId: cashier.id,
          visitId: created.id,
          action: "VISIT_PENDING_REVIEW",
          metadata: { reasonCode: result.reasonCode, businessDate },
        },
      });

      return created;
    });

    return { type: "PENDING" as const, id: visit.id, message: "Scan needs admin approval." };
  }

  const earnKey = earnKeyFor(card.id, businessDate);
  const visit = await autoApproveVisit({
    card,
    branchId: branch.id,
    cashierId: cashier.id,
    businessDate,
    earnKey,
    qrTokenHash,
    flags,
  }).catch(async (error: unknown) => {
    if (!isUniqueConstraintError(error)) throw error;
    const attempt = await createVisitAttempt(prisma, {
      actorId: cashier.id,
      qrTokenHash,
      loyaltyCardId: card.id,
      branchId: branch.id,
      cashierId: cashier.id,
      status: "REJECTED",
      reasonCode: "DUPLICATE_SAME_DAY",
      message: scanMessage("DUPLICATE_SAME_DAY"),
      businessDate,
      flags: { ...flags, repeatedCustomerScan: true },
      nextEligibleAt,
    });

    return {
      blockedAttempt: attempt,
    };
  });

  if ("blockedAttempt" in visit) {
    return {
      type: "BLOCKED" as const,
      id: visit.blockedAttempt.id,
      reasonCode: visit.blockedAttempt.reasonCode,
      message: visit.blockedAttempt.message,
      nextEligibleAt: visit.blockedAttempt.nextEligibleAt,
    };
  }

  return {
    type: "AUTO_APPROVED" as const,
    id: visit.id,
    message: `Visit approved. ${POINTS_PER_VISIT} points added.`,
  };
}

export function earnKeyFor(loyaltyCardId: string, businessDate: string) {
  return `${loyaltyCardId}:${businessDate}`;
}

export async function autoApproveVisit({
  card,
  branchId,
  cashierId,
  businessDate,
  earnKey,
  qrTokenHash,
  flags,
}: {
  card: ResolvedCard;
  branchId: string;
  cashierId: string;
  businessDate: string;
  earnKey: string;
  qrTokenHash: string | null;
  flags: ScanAttemptFlags;
}) {
  return prisma.$transaction(async (tx) => {
    const created = await tx.visit.create({
      data: {
        loyaltyCardId: card.id,
        customerId: card.profileId,
        branchId,
        cashierId,
        status: "AUTO_APPROVED",
        approvalStatus: "NOT_REQUIRED",
        pointsAwarded: POINTS_PER_VISIT,
        businessDate,
        earnKey,
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

    await createVisitAttempt(tx, {
      actorId: cashierId,
      qrTokenHash,
      loyaltyCardId: card.id,
      branchId,
      cashierId,
      status: "AUTO_APPROVED",
      message: "Visit approved.",
      businessDate,
      flags,
      visitId: created.id,
    });

    await tx.auditEvent.create({
      data: {
        actorId: cashierId,
        visitId: created.id,
        action: "VISIT_AUTO_APPROVED",
        metadata: { points: POINTS_PER_VISIT, businessDate },
      },
    });

    return created;
  });
}

type ScanAttemptFlags = {
  repeatedCustomerScan: boolean;
  repeatedCashierFailure: boolean;
  invalidQrBurst: boolean;
  multipleBranchSameDay: boolean;
};

async function scanAttemptFlags({
  businessDate,
  cashierId,
  loyaltyCardId,
  qrTokenHash,
  multipleBranchSameDay,
}: {
  businessDate: string;
  cashierId: string;
  loyaltyCardId?: string;
  qrTokenHash: string | null;
  multipleBranchSameDay: boolean;
}): Promise<ScanAttemptFlags> {
  const [customerAttempts, cashierFailures, invalidQrAttempts] = await Promise.all([
    loyaltyCardId
      ? prisma.scanAttempt.count({ where: { loyaltyCardId, businessDate } })
      : Promise.resolve(0),
    prisma.scanAttempt.count({ where: { cashierId, businessDate, status: "REJECTED" } }),
    qrTokenHash
      ? prisma.scanAttempt.count({ where: { qrTokenHash, businessDate, reasonCode: { in: ["QR_NOT_FOUND", "INVALID_QR"] } } })
      : Promise.resolve(0),
  ]);

  return {
    repeatedCustomerScan: customerAttempts > 0,
    repeatedCashierFailure: cashierFailures > 0,
    invalidQrBurst: invalidQrAttempts >= 2,
    multipleBranchSameDay,
  };
}

export async function createVisitAttempt(
  db: AttemptDb,
  {
    actorId,
    qrTokenHash,
    loyaltyCardId,
    branchId,
    cashierId,
    status,
    reasonCode,
    message,
    businessDate,
    flags,
    nextEligibleAt,
    visitId,
  }: {
    actorId: string;
    qrTokenHash?: string | null;
    loyaltyCardId?: string;
    branchId?: string;
    cashierId?: string;
    status?: VisitStatus;
    reasonCode?: VisitReasonCode;
    message: string;
    businessDate: string;
    flags: ScanAttemptFlags;
    nextEligibleAt?: Date | null;
    visitId?: string;
  },
) {
  const attempt = await db.scanAttempt.create({
    data: {
      qrTokenHash,
      loyaltyCardId,
      branchId,
      cashierId,
      status,
      reasonCode,
      message,
      businessDate,
      repeatedCustomerScan: flags.repeatedCustomerScan,
      repeatedCashierFailure: flags.repeatedCashierFailure,
      invalidQrBurst: flags.invalidQrBurst,
      multipleBranchSameDay: flags.multipleBranchSameDay,
      nextEligibleAt,
    },
  });

  await db.auditEvent.create({
    data: {
      actorId,
      visitId,
      action:
        reasonCode === "DUPLICATE_SAME_DAY" || reasonCode === "ALREADY_USED_OTHER_BRANCH"
          ? "SCAN_BLOCKED_DUPLICATE"
          : "SCAN_ATTEMPT",
      metadata: {
        scanAttemptId: attempt.id,
        status,
        reasonCode,
        businessDate,
        flags,
      },
    },
  });

  return attempt;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
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

