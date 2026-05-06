"use server";

import { POINTS_PER_VISIT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireBranchScopedProfile } from "@/lib/services/session";
import { approveVisitSchema, rejectVisitSchema } from "@/lib/validations/admin";

export async function getAdminDashboard() {
  const { start, end } = await import("@/lib/time").then((mod) => mod.businessDayWindow());
  const [visitsToday, pendingApprovals, approvedVisits, rejectedVisits, branches] = await Promise.all([
    prisma.visit.count({ where: { scannedAt: { gte: start, lt: end } } }),
    prisma.visit.count({ where: { status: "PENDING" } }),
    prisma.visit.count({ where: { status: { in: ["AUTO_APPROVED", "APPROVED"] }, scannedAt: { gte: start, lt: end } } }),
    prisma.visit.count({ where: { status: "REJECTED", scannedAt: { gte: start, lt: end } } }),
    prisma.branch.findMany({ include: { _count: { select: { visits: true, staffAssignments: true } } }, take: 6 }),
  ]);

  return { visitsToday, pendingApprovals, approvedVisits, rejectedVisits, branches };
}

export async function listPendingApprovals(branchIds?: string[]) {
  return prisma.visit.findMany({
    where: {
      status: "PENDING",
      ...(branchIds?.length ? { branchId: { in: branchIds } } : {}),
    },
    include: { customer: true, branch: true, cashier: true },
    orderBy: { scannedAt: "desc" },
  });
}

export async function getApprovalDetail(visitId: string) {
  const visit = await prisma.visit.findUniqueOrThrow({
    where: { id: visitId },
    include: {
      customer: { include: { loyaltyCard: true } },
      branch: true,
      cashier: true,
      auditEvents: { include: { actor: true }, orderBy: { createdAt: "desc" } },
    },
  });
  const { start, end } = await import("@/lib/time").then((mod) => mod.businessDayWindow(visit.scannedAt));
  const previous = await prisma.visit.findFirst({
    where: {
      loyaltyCardId: visit.loyaltyCardId,
      id: { not: visit.id },
      scannedAt: { gte: start, lt: end },
    },
    include: { branch: true },
    orderBy: { scannedAt: "desc" },
  });

  return { visit, previous };
}

export async function approveVisitAction(formData: FormData) {
  const parsed = approveVisitSchema.parse(Object.fromEntries(formData.entries()));
  const actor = await requireBranchScopedProfile();

  const visit = await prisma.visit.findUniqueOrThrow({ where: { id: parsed.visitId } });
  await requireBranchScopedProfile(visit.branchId);

  await prisma.$transaction(async (tx) => {
    const existingLedger = await tx.pointLedger.findUnique({
      where: { visitId_type: { visitId: visit.id, type: "EARN" } },
    });

    await tx.visit.update({
      where: { id: visit.id },
      data: {
        status: parsed.override ? "APPROVED" : "APPROVED",
        approvalStatus: parsed.override ? "OVERRIDDEN" : "APPROVED",
        pointsAwarded: existingLedger ? visit.pointsAwarded : POINTS_PER_VISIT,
        approvedAt: new Date(),
        reviewedById: actor.id,
      },
    });

    if (!existingLedger) {
      await tx.pointLedger.create({
        data: {
          loyaltyCardId: visit.loyaltyCardId,
          profileId: visit.customerId,
          visitId: visit.id,
          type: "EARN",
          points: POINTS_PER_VISIT,
          description: parsed.override ? "Override approved visit earn" : "Admin approved visit earn",
        },
      });

      await tx.loyaltyCard.update({
        where: { id: visit.loyaltyCardId },
        data: {
          pointsBalance: { increment: POINTS_PER_VISIT },
          totalEarned: { increment: POINTS_PER_VISIT },
          visitsEarned: { increment: 1 },
          lastVisitAt: visit.scannedAt,
        },
      });
    }

    await tx.auditEvent.create({
      data: {
        actorId: actor.id,
        visitId: visit.id,
        action: parsed.override ? "VISIT_OVERRIDDEN" : "VISIT_APPROVED",
        metadata: { previousStatus: visit.status },
      },
    });
  });
}

export async function rejectVisitAction(formData: FormData) {
  const parsed = rejectVisitSchema.parse(Object.fromEntries(formData.entries()));
  const actor = await requireBranchScopedProfile();
  const visit = await prisma.visit.findUniqueOrThrow({ where: { id: parsed.visitId } });
  await requireBranchScopedProfile(visit.branchId);

  await prisma.$transaction([
    prisma.visit.update({
      where: { id: visit.id },
      data: {
        status: "REJECTED",
        approvalStatus: "REJECTED",
        reason: parsed.reason,
        rejectedAt: new Date(),
        reviewedById: actor.id,
      },
    }),
    prisma.auditEvent.create({
      data: {
        actorId: actor.id,
        visitId: visit.id,
        action: "VISIT_REJECTED",
        metadata: { reason: parsed.reason, previousStatus: visit.status },
      },
    }),
  ]);
}

export async function listBranches() {
  return prisma.branch.findMany({
    include: {
      _count: { select: { visits: true, staffAssignments: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getBranchDetail(branchId: string) {
  return prisma.branch.findUniqueOrThrow({
    where: { id: branchId },
    include: {
      staffAssignments: { include: { profile: true }, orderBy: { createdAt: "desc" } },
      visits: { orderBy: { scannedAt: "desc" }, take: 10 },
      _count: { select: { visits: true } },
    },
  });
}

export async function listStaff() {
  return prisma.staffAssignment.findMany({
    include: { profile: true, branch: true },
    orderBy: { createdAt: "desc" },
  });
}

