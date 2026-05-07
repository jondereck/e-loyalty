"use server";

import { revalidatePath } from "next/cache";
import type { AppRole } from "@/generated/prisma/client";
import { POINTS_PER_VISIT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { earnKeyFor } from "@/lib/services/visits";
import { branchIdsForAdmin, requireBranchScopedProfile } from "@/lib/services/session";
import { computeBusinessDate } from "@/lib/time";
import {
  adjustMemberPointsSchema,
  approveVisitSchema,
  rejectVisitSchema,
  updateCardStatusSchema,
  updateMemberProfileStatusSchema,
} from "@/lib/validations/admin";

export async function getAdminDashboard(branchIds?: string[]) {
  const { start, end } = await import("@/lib/time").then((mod) => mod.businessDayWindow());
  const scoped = Array.isArray(branchIds);
  const visitScope = scoped ? { branchId: { in: branchIds } } : {};
  const branchScope = scoped ? { id: { in: branchIds } } : {};
  const [visitsToday, pendingApprovals, approvedVisits, rejectedVisits, branches] = await Promise.all([
    prisma.visit.count({ where: { ...visitScope, scannedAt: { gte: start, lt: end } } }),
    prisma.visit.count({ where: { ...visitScope, status: "PENDING" } }),
    prisma.visit.count({ where: { ...visitScope, status: { in: ["AUTO_APPROVED", "APPROVED"] }, scannedAt: { gte: start, lt: end } } }),
    prisma.visit.count({ where: { ...visitScope, status: "REJECTED", scannedAt: { gte: start, lt: end } } }),
    prisma.branch.findMany({ where: branchScope, include: { _count: { select: { visits: true, staffAssignments: true } } }, take: 6 }),
  ]);

  const [totalUsers, customerUsers, staffUsers, activeStaff] = await Promise.all([
    countScopedUsers(branchIds),
    countScopedCustomers(branchIds),
    countScopedStaff(branchIds),
    countScopedStaff(branchIds, true),
  ]);

  const [redemptions, approvedLifetime, recentActivity] = await Promise.all([
    prisma.rewardRedemption.count({ where: scoped ? { branchId: { in: branchIds } } : {} }),
    prisma.visit.count({ where: { ...visitScope, status: { in: ["AUTO_APPROVED", "APPROVED"] } } }),
    prisma.auditEvent.findMany({
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);
  const redemptionRate = approvedLifetime ? Math.round((redemptions / approvedLifetime) * 1000) / 10 : 0;

  return {
    visitsToday,
    pendingApprovals,
    approvedVisits,
    rejectedVisits,
    branches,
    totalUsers,
    customerUsers,
    staffUsers,
    activeStaff,
    redemptions,
    redemptionRate,
    recentActivity,
  };
}

export async function listPendingApprovals(branchIds?: string[]) {
  return prisma.visit.findMany({
    where: {
      status: "PENDING",
      ...(Array.isArray(branchIds) ? { branchId: { in: branchIds } } : {}),
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
  const businessDate = visit.businessDate || computeBusinessDate(visit.scannedAt);
  const previous = await prisma.visit.findFirst({
    where: {
      loyaltyCardId: visit.loyaltyCardId,
      id: { not: visit.id },
      OR: [
        { businessDate },
        { businessDate: "", scannedAt: { gte: start, lt: end } },
      ],
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
  if (parsed.override && !actor.roles.includes("SUPER_ADMIN")) {
    throw new Error("Only Super Admin can override visit decisions.");
  }

  await approveVisit(parsed.visitId, actor.id, Boolean(parsed.override));
  revalidateAdmin();
}

export async function approveVisit(visitId: string, actorId: string, override = false) {
  await prisma.$transaction(async (tx) => {
    const visit = await tx.visit.findUniqueOrThrow({ where: { id: visitId } });
    if (visit.status !== "PENDING") {
      throw new Error("Only pending visits can be approved.");
    }

    const existingLedger = await tx.pointLedger.findUnique({
      where: { visitId_type: { visitId: visit.id, type: "EARN" } },
    });
    if (existingLedger) throw new Error("This visit already has an earn ledger entry.");

    const businessDate = visit.businessDate || computeBusinessDate(visit.scannedAt);
    const earnKey = earnKeyFor(visit.loyaltyCardId, businessDate);
    const earnedToday = await tx.visit.findFirst({
      where: {
        id: { not: visit.id },
        earnKey,
        status: { in: ["AUTO_APPROVED", "APPROVED"] },
      },
    });
    if (earnedToday) throw new Error("Customer already earned for this business day.");

    await tx.visit.update({
      where: { id: visit.id },
      data: {
        status: "APPROVED",
        approvalStatus: override ? "OVERRIDDEN" : "APPROVED",
        pointsAwarded: POINTS_PER_VISIT,
        businessDate,
        earnKey,
        approvedAt: new Date(),
        reviewedById: actorId,
      },
    });

    await tx.pointLedger.create({
      data: {
        loyaltyCardId: visit.loyaltyCardId,
        profileId: visit.customerId,
        visitId: visit.id,
        type: "EARN",
        points: POINTS_PER_VISIT,
        description: override ? "Override approved visit earn" : "Admin approved visit earn",
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

    await tx.auditEvent.create({
      data: {
        actorId,
        visitId: visit.id,
        action: override ? "VISIT_OVERRIDDEN" : "VISIT_APPROVED",
        metadata: { previousStatus: visit.status, businessDate },
      },
    });
  });
}

export async function rejectVisitAction(formData: FormData) {
  const parsed = rejectVisitSchema.parse(Object.fromEntries(formData.entries()));
  const actor = await requireBranchScopedProfile();
  const visit = await prisma.visit.findUniqueOrThrow({ where: { id: parsed.visitId } });
  await requireBranchScopedProfile(visit.branchId);

  await rejectVisit(parsed.visitId, actor.id, parsed.reason);
  revalidateAdmin();
}

export async function rejectVisit(visitId: string, actorId: string, reason: string) {
  const visit = await prisma.visit.findUniqueOrThrow({ where: { id: visitId } });
  if (visit.status !== "PENDING") {
    throw new Error("Only pending visits can be rejected.");
  }

  await prisma.$transaction([
    prisma.visit.update({
      where: { id: visit.id },
      data: {
        status: "REJECTED",
        approvalStatus: "REJECTED",
        reason,
        rejectedAt: new Date(),
        reviewedById: actorId,
      },
    }),
    prisma.auditEvent.create({
      data: {
        actorId,
        visitId: visit.id,
        action: "VISIT_REJECTED",
        metadata: { reason, previousStatus: visit.status },
      },
    }),
  ]);
}

export async function listBranches(branchIds?: string[]) {
  return prisma.branch.findMany({
    where: Array.isArray(branchIds) ? { id: { in: branchIds } } : {},
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

export async function listScopedStaffForProfile() {
  const profile = await requireBranchScopedProfile();
  return listStaff(branchIdsForAdmin(profile));
}

export async function listStaff(branchIds?: string[]) {
  return prisma.staffAssignment.findMany({
    where: Array.isArray(branchIds) ? { branchId: { in: branchIds } } : {},
    include: { profile: true, branch: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function listMembers(branchIds?: string[]) {
  const scoped = Array.isArray(branchIds);
  const members = await prisma.userProfile.findMany({
    where: {
      roles: { has: "CUSTOMER" },
      ...(scoped ? { visits: { some: { branchId: { in: branchIds } } } } : {}),
    },
    include: {
      loyaltyCard: true,
      visits: {
        where: scoped ? { branchId: { in: branchIds } } : {},
        orderBy: { scannedAt: "desc" },
        take: 1,
        include: { branch: true },
      },
      _count: { select: { visits: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    members,
    metrics: {
      total: members.length,
      active: members.filter((member) => member.status === "ACTIVE").length,
      blockedCards: members.filter((member) => member.loyaltyCard?.status === "BLOCKED").length,
      totalPoints: members.reduce((sum, member) => sum + (member.loyaltyCard?.pointsBalance ?? 0), 0),
    },
  };
}

export async function getMemberDetail(profileId: string, branchIds?: string[]) {
  const scoped = Array.isArray(branchIds);
  const member = await prisma.userProfile.findFirst({
    where: {
      id: profileId,
      roles: { has: "CUSTOMER" },
      ...(scoped ? { visits: { some: { branchId: { in: branchIds } } } } : {}),
    },
    include: {
      loyaltyCard: true,
      visits: {
        where: scoped ? { branchId: { in: branchIds } } : {},
        include: { branch: true, cashier: true },
        orderBy: { scannedAt: "desc" },
        take: 10,
      },
      ledgerEntries: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      redemptions: {
        where: scoped ? { OR: [{ branchId: { in: branchIds } }, { branchId: null }] } : {},
        include: { milestone: true, branch: true },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      auditEvents: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: { select: { visits: true, redemptions: true } },
    },
  });

  return member;
}

export async function updateMemberCardStatusAction(formData: FormData) {
  const parsed = updateCardStatusSchema.parse(Object.fromEntries(formData.entries()));
  const actor = await requireMemberManager(parsed.profileId);
  const member = await prisma.userProfile.findUniqueOrThrow({
    where: { id: parsed.profileId },
    include: { loyaltyCard: true },
  });
  if (!member.loyaltyCard) throw new Error("This member does not have a loyalty card.");

  await prisma.$transaction([
    prisma.loyaltyCard.update({
      where: { id: member.loyaltyCard.id },
      data: { status: parsed.status },
    }),
    prisma.auditEvent.create({
      data: {
        actorId: actor.id,
        action: "MEMBER_CARD_STATUS_UPDATED",
        metadata: {
          profileId: member.id,
          cardId: member.loyaltyCard.id,
          previousStatus: member.loyaltyCard.status,
          nextStatus: parsed.status,
        },
      },
    }),
  ]);
  revalidateMember(member.id);
}

export async function updateMemberProfileStatusAction(formData: FormData) {
  const parsed = updateMemberProfileStatusSchema.parse(Object.fromEntries(formData.entries()));
  const actor = await requireMemberManager(parsed.profileId);
  const member = await prisma.userProfile.findUniqueOrThrow({ where: { id: parsed.profileId } });

  await prisma.$transaction([
    prisma.userProfile.update({
      where: { id: member.id },
      data: { status: parsed.status },
    }),
    prisma.auditEvent.create({
      data: {
        actorId: actor.id,
        action: "MEMBER_PROFILE_STATUS_UPDATED",
        metadata: {
          profileId: member.id,
          previousStatus: member.status,
          nextStatus: parsed.status,
        },
      },
    }),
  ]);
  revalidateMember(member.id);
}

export async function adjustMemberPointsAction(formData: FormData) {
  const parsed = adjustMemberPointsSchema.parse(Object.fromEntries(formData.entries()));
  const actor = await requireMemberManager(parsed.profileId);
  const member = await prisma.userProfile.findUniqueOrThrow({
    where: { id: parsed.profileId },
    include: { loyaltyCard: true },
  });
  if (!member.loyaltyCard) throw new Error("This member does not have a loyalty card.");

  const nextBalance = member.loyaltyCard.pointsBalance + parsed.points;
  if (nextBalance < 0) throw new Error("Point adjustment cannot make the balance negative.");

  await prisma.$transaction([
    prisma.pointLedger.create({
      data: {
        loyaltyCardId: member.loyaltyCard.id,
        profileId: member.id,
        type: "ADJUST",
        points: parsed.points,
        description: parsed.reason,
      },
    }),
    prisma.loyaltyCard.update({
      where: { id: member.loyaltyCard.id },
      data: {
        pointsBalance: { increment: parsed.points },
      },
    }),
    prisma.auditEvent.create({
      data: {
        actorId: actor.id,
        action: "MEMBER_POINTS_ADJUSTED",
        metadata: {
          profileId: member.id,
          cardId: member.loyaltyCard.id,
          points: parsed.points,
          reason: parsed.reason,
          previousBalance: member.loyaltyCard.pointsBalance,
          nextBalance,
        },
      },
    }),
  ]);
  revalidateMember(member.id);
}

async function countScopedUsers(branchIds?: string[]) {
  if (!Array.isArray(branchIds)) return prisma.userProfile.count();
  const [customers, staff] = await Promise.all([
    prisma.visit.findMany({ where: { branchId: { in: branchIds } }, select: { customerId: true }, distinct: ["customerId"] }),
    prisma.staffAssignment.findMany({ where: { branchId: { in: branchIds } }, select: { profileId: true }, distinct: ["profileId"] }),
  ]);
  return new Set([...customers.map((item) => item.customerId), ...staff.map((item) => item.profileId)]).size;
}

async function countScopedCustomers(branchIds?: string[]) {
  if (!Array.isArray(branchIds)) return prisma.userProfile.count({ where: { roles: { has: "CUSTOMER" } } });
  return prisma.visit
    .findMany({ where: { branchId: { in: branchIds } }, select: { customerId: true }, distinct: ["customerId"] })
    .then((items) => items.length);
}

async function countScopedStaff(branchIds?: string[], activeOnly = false) {
  const staffRoles: AppRole[] = ["CASHIER", "BRANCH_ADMIN"];
  const where = {
    role: { in: staffRoles },
    ...(Array.isArray(branchIds) ? { branchId: { in: branchIds } } : {}),
    ...(activeOnly ? { status: "ACTIVE" as const } : {}),
  };
  return prisma.staffAssignment.findMany({ where, select: { profileId: true }, distinct: ["profileId"] }).then((items) => items.length);
}

async function requireMemberManager(profileId: string) {
  const profile = await requireBranchScopedProfile();
  if (profile.roles.includes("SUPER_ADMIN")) return profile;
  const branchIds = branchIdsForAdmin(profile);
  if (!branchIds?.length) throw new Error("You do not have permission to manage members.");

  const member = await getMemberDetail(profileId, branchIds);
  if (!member) throw new Error("You do not have permission to manage this member.");
  return profile;
}

function revalidateMember(profileId: string) {
  revalidateAdmin();
  revalidatePath("/admin/members");
  revalidatePath(`/admin/members/${profileId}`);
  revalidatePath("/card");
  revalidatePath("/history");
  revalidatePath("/rewards");
  revalidatePath("/profile");
}

function revalidateAdmin() {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/staff");
  revalidatePath("/admin/members");
  revalidatePath("/super-admin/dashboard");
}

