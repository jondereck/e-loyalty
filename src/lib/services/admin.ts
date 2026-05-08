"use server";

import { revalidatePath } from "next/cache";
import type { AppRole, Prisma, StaffAssignmentStatus } from "@/generated/prisma/client";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import { earnKeyFor } from "@/lib/services/visits";
import { getBusinessTimezone, getPointsPerVisit } from "@/lib/services/settings";
import { branchIdsForAdmin, requireBranchScopedProfile } from "@/lib/services/session";
import { computeBusinessDate } from "@/lib/time";
import {
  adjustMemberPointsSchema,
  approveVisitSchema,
  createBranchSchema,
  deleteBranchSchema,
  deleteStaffAccountSchema,
  createStaffAssignmentSchema,
  createStaffAccountSchema,
  removeStaffAssignmentSchema,
  rejectVisitSchema,
  updateCardStatusSchema,
  updateBranchSchema,
  updateMemberProfileStatusSchema,
  updateStaffAssignmentStatusSchema,
} from "@/lib/validations/admin";

export async function getAdminDashboard(branchIds?: string[]) {
  const businessTimezone = await getBusinessTimezone();
  const { start, end } = await import("@/lib/time").then((mod) => mod.businessDayWindow(new Date(), businessTimezone));
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

export type ApprovalManagementOptions = {
  branchIds?: string[];
  status?: "all" | "pending" | "approved" | "rejected";
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

const approvalInclude = {
  customer: { include: { loyaltyCard: true } },
  branch: true,
  cashier: true,
} satisfies Prisma.VisitInclude;

export async function getApprovalManagementData(options: ApprovalManagementOptions = {}) {
  const pageSize = normalizePageSize(options.pageSize, 7);
  const page = normalizePage(options.page);
  const baseWhere = approvalBaseWhere(options);
  const where = {
    ...baseWhere,
    ...approvalStatusWhere(options.status),
  } satisfies Prisma.VisitWhereInput;

  const [totalFiltered, counts] = await Promise.all([
    prisma.visit.count({ where }),
    getApprovalTabCounts(baseWhere),
  ]);
  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visits = await prisma.visit.findMany({
    where,
    include: approvalInclude,
    orderBy: { scannedAt: "desc" },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  });
  const dates = defaultDateRange();

  return {
    visits,
    counts,
    filters: {
      status: options.status ?? "all",
      query: options.query?.trim() ?? "",
      dateFrom: options.dateFrom ?? dates.dateFrom,
      dateTo: options.dateTo ?? dates.dateTo,
    },
    pagination: paginationPayload(totalFiltered, currentPage, pageSize),
  };
}

export async function getApprovalExportRows(options: ApprovalManagementOptions = {}) {
  return prisma.visit.findMany({
    where: {
      ...approvalBaseWhere(options),
      ...approvalStatusWhere(options.status),
    },
    include: approvalInclude,
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
  const businessTimezone = await getBusinessTimezone();
  const { start, end } = await import("@/lib/time").then((mod) => mod.businessDayWindow(visit.scannedAt, businessTimezone));
  const businessDate = visit.businessDate || computeBusinessDate(visit.scannedAt, businessTimezone);
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

  await approveVisit(parsed.visitId, actor.id, Boolean(parsed.override), parsed.adminNote);
  revalidateAdmin();
}

export async function approveVisit(visitId: string, actorId: string, override = false, adminNote?: string | null) {
  const pointsPerVisit = await getPointsPerVisit();
  const businessTimezone = await getBusinessTimezone();

  await prisma.$transaction(async (tx) => {
    const visit = await tx.visit.findUniqueOrThrow({ where: { id: visitId } });
    if (visit.status !== "PENDING") {
      throw new Error("Only pending visits can be approved.");
    }

    const existingLedger = await tx.pointLedger.findUnique({
      where: { visitId_type: { visitId: visit.id, type: "EARN" } },
    });
    if (existingLedger) throw new Error("This visit already has an earn ledger entry.");

    const businessDate = visit.businessDate || computeBusinessDate(visit.scannedAt, businessTimezone);
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
        pointsAwarded: pointsPerVisit,
        businessDate,
        earnKey,
        approvedAt: new Date(),
        reviewedById: actorId,
        adminNote,
      },
    });

    await tx.pointLedger.create({
      data: {
        loyaltyCardId: visit.loyaltyCardId,
        profileId: visit.customerId,
        visitId: visit.id,
        type: "EARN",
        points: pointsPerVisit,
        description: override ? "Override approved visit earn" : "Admin approved visit earn",
      },
    });

    await tx.loyaltyCard.update({
      where: { id: visit.loyaltyCardId },
      data: {
        pointsBalance: { increment: pointsPerVisit },
        totalEarned: { increment: pointsPerVisit },
        visitsEarned: { increment: 1 },
        lastVisitAt: visit.scannedAt,
      },
    });

    await tx.auditEvent.create({
      data: {
        actorId,
        visitId: visit.id,
        action: override ? "VISIT_OVERRIDDEN" : "VISIT_APPROVED",
        metadata: { previousStatus: visit.status, businessDate, adminNote },
      },
    });
  });
}

export async function rejectVisitAction(formData: FormData) {
  const parsed = rejectVisitSchema.parse(Object.fromEntries(formData.entries()));
  const actor = await requireBranchScopedProfile();
  const visit = await prisma.visit.findUniqueOrThrow({ where: { id: parsed.visitId } });
  await requireBranchScopedProfile(visit.branchId);

  await rejectVisit(parsed.visitId, actor.id, parsed.reason, parsed.adminNote);
  revalidateAdmin();
}

export async function rejectVisit(visitId: string, actorId: string, reason: string, adminNote?: string | null) {
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
        adminNote,
        rejectedAt: new Date(),
        reviewedById: actorId,
      },
    }),
    prisma.auditEvent.create({
      data: {
        actorId,
        visitId: visit.id,
        action: "VISIT_REJECTED",
        metadata: { reason, adminNote, previousStatus: visit.status },
      },
    }),
  ]);
}

const branchInclude = {
  _count: { select: { visits: true, staffAssignments: true } },
} satisfies Prisma.BranchInclude;

export type BranchListOptions = {
  branchIds?: string[];
  query?: string;
  page?: number;
  pageSize?: number;
};

export async function listBranches(branchIds?: string[]) {
  return prisma.branch.findMany({
    where: branchScopeWhere(branchIds),
    include: branchInclude,
    orderBy: { name: "asc" },
  });
}

export async function getBranchManagementData(options: BranchListOptions = {}) {
  const pageSize = normalizePageSize(options.pageSize);
  const requestedPage = Number.isFinite(options.page) ? options.page ?? 1 : 1;
  const page = Math.max(1, Math.floor(requestedPage));
  const where = branchScopeWhere(options.branchIds, options.query);
  const scopedWhere = branchScopeWhere(options.branchIds);

  const [totalScoped, activeScoped, totalFiltered, totalStaff] = await Promise.all([
    prisma.branch.count({ where: scopedWhere }),
    prisma.branch.count({ where: { ...scopedWhere, status: "ACTIVE" } }),
    prisma.branch.count({ where }),
    prisma.staffAssignment.count({
      where: Array.isArray(options.branchIds) ? { branchId: { in: options.branchIds } } : {},
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const currentPage = Math.min(page, pageCount);
  const branches = await prisma.branch.findMany({
    where,
    include: branchInclude,
    orderBy: { name: "asc" },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  });

  return {
    branches,
    metrics: {
      totalBranches: totalScoped,
      activeBranches: activeScoped,
      activePercent: totalScoped ? Math.round((activeScoped / totalScoped) * 1000) / 10 : 0,
      staffAssigned: totalStaff,
    },
    pagination: {
      page: currentPage,
      pageSize,
      pageCount,
      total: totalFiltered,
      from: totalFiltered ? (currentPage - 1) * pageSize + 1 : 0,
      to: Math.min(currentPage * pageSize, totalFiltered),
    },
    query: options.query?.trim() ?? "",
  };
}

export async function getBranchSetupOptions(branchIds?: string[]) {
  return prisma.branch.findMany({
    where: Array.isArray(branchIds) ? { id: { in: branchIds } } : {},
    orderBy: { name: "asc" },
  });
}

export async function getBranchDetail(branchId: string) {
  const businessTimezone = await getBusinessTimezone();
  const { end } = await import("@/lib/time").then((mod) => mod.businessDayWindow(new Date(), businessTimezone));
  const weekStart = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
  const branch = await prisma.branch.findUniqueOrThrow({
    where: { id: branchId },
    include: {
      staffAssignments: { include: { profile: true }, orderBy: { createdAt: "desc" } },
      visits: { include: { customer: true, cashier: true }, orderBy: { scannedAt: "desc" }, take: 10 },
      _count: { select: { visits: true, staffAssignments: true } },
    },
  });

  const [weeklyVisits, previousWeeklyVisits, weeklyPointsEarned, weeklyRedemptions, approvedLifetime, redemptionsLifetime] = await Promise.all([
    prisma.visit.count({ where: { branchId, scannedAt: { gte: weekStart, lt: end } } }),
    prisma.visit.count({ where: { branchId, scannedAt: { gte: new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000), lt: weekStart } } }),
    prisma.visit.aggregate({
      where: { branchId, scannedAt: { gte: weekStart, lt: end }, status: { in: ["AUTO_APPROVED", "APPROVED"] } },
      _sum: { pointsAwarded: true },
    }),
    prisma.rewardRedemption.count({ where: { branchId, createdAt: { gte: weekStart, lt: end } } }),
    prisma.visit.count({ where: { branchId, status: { in: ["AUTO_APPROVED", "APPROVED"] } } }),
    prisma.rewardRedemption.count({ where: { branchId } }),
  ]);

  const weeklyVisitDelta = previousWeeklyVisits
    ? Math.round(((weeklyVisits - previousWeeklyVisits) / previousWeeklyVisits) * 1000) / 10
    : weeklyVisits ? 100 : 0;
  const redemptionRate = approvedLifetime ? Math.round((redemptionsLifetime / approvedLifetime) * 1000) / 10 : 0;

  return {
    branch,
    performance: {
      weeklyVisits,
      weeklyVisitDelta,
      weeklyPointsEarned: weeklyPointsEarned._sum.pointsAwarded ?? 0,
      weeklyRedemptions,
      redemptionRate,
    },
  };
}

export async function createBranchAction(formData: FormData) {
  const parsed = createBranchSchema.parse(Object.fromEntries(formData.entries()));
  const actor = await requireSuperAdmin();

  const branch = await prisma.branch.create({ data: parsed });
  await prisma.auditEvent.create({
    data: {
      actorId: actor.id,
      action: "BRANCH_CREATED",
      metadata: {
        branchId: branch.id,
        code: branch.code,
        name: branch.name,
        address: branch.address,
        phone: branch.phone,
        email: branch.email,
        status: branch.status,
      },
    },
  });
  revalidateBranchSetup(branch.id);
}

export type BranchActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export async function createBranchFormAction(_state: BranchActionState, formData: FormData): Promise<BranchActionState> {
  try {
    await createBranchAction(formData);
    return { ok: true, message: "Branch created." };
  } catch (error) {
    return branchActionError(error);
  }
}

export async function updateBranchAction(formData: FormData) {
  const parsed = updateBranchSchema.parse(Object.fromEntries(formData.entries()));
  const actor = await requireBranchManager(parsed.branchId);
  const previous = await prisma.branch.findUniqueOrThrow({ where: { id: parsed.branchId } });

  const branch = await prisma.branch.update({
    where: { id: parsed.branchId },
    data: {
      code: parsed.code,
      name: parsed.name,
      address: parsed.address,
      phone: parsed.phone,
      email: parsed.email,
      status: parsed.status,
    },
  });
  await prisma.auditEvent.create({
    data: {
      actorId: actor.id,
      action: "BRANCH_UPDATED",
      metadata: {
        branchId: branch.id,
        previous: {
          code: previous.code,
          name: previous.name,
          address: previous.address,
          phone: previous.phone,
          email: previous.email,
          status: previous.status,
        },
        next: {
          code: branch.code,
          name: branch.name,
          address: branch.address,
          phone: branch.phone,
          email: branch.email,
          status: branch.status,
        },
      },
    },
  });
  revalidateBranchSetup(branch.id);
}

export async function updateBranchFormAction(_state: BranchActionState, formData: FormData): Promise<BranchActionState> {
  try {
    await updateBranchAction(formData);
    return { ok: true, message: "Branch updated." };
  } catch (error) {
    return branchActionError(error);
  }
}

export async function deleteBranchFormAction(_state: BranchActionState, formData: FormData): Promise<BranchActionState> {
  try {
    const parsed = deleteBranchSchema.parse(Object.fromEntries(formData.entries()));
    const actor = await requireSuperAdmin();
    const branch = await prisma.branch.findUniqueOrThrow({
      where: { id: parsed.branchId },
      include: { _count: { select: { staffAssignments: true, visits: true, scanAttempts: true, redemptions: true } } },
    });
    if (branch._count.staffAssignments > 0) {
      return { message: "Cannot delete branch while staff are assigned." };
    }
    if (branch._count.visits > 0 || branch._count.scanAttempts > 0 || branch._count.redemptions > 0) {
      return { message: "Cannot delete branch with existing activity history." };
    }

    await prisma.$transaction(async (tx) => {
      await tx.branch.delete({ where: { id: branch.id } });
      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          action: "BRANCH_DELETED",
          metadata: {
            branchId: branch.id,
            code: branch.code,
            name: branch.name,
          },
        },
      });
    });
    revalidateAdmin();
    revalidatePath("/admin/branches");
    return { ok: true, message: "Branch deleted." };
  } catch (error) {
    return branchActionError(error);
  }
}

export async function getBranchExportRows(branchIds?: string[], query?: string) {
  return prisma.branch.findMany({
    where: branchScopeWhere(branchIds, query),
    include: branchInclude,
    orderBy: { name: "asc" },
  });
}

export async function listScopedStaffForProfile() {
  const profile = await requireBranchScopedProfile();
  return listStaff(branchIdsForAdmin(profile));
}

export async function listStaff(branchIds?: string[], query?: string) {
  const where = staffAssignmentWhere(branchIds, query);

  return prisma.staffAssignment.findMany({
    where,
    include: {
      profile: {
        include: {
          staffAssignments: true,
          _count: { select: { cashierVisits: true } },
        },
      },
      branch: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

function staffAssignmentWhere(branchIds?: string[], query?: string): Prisma.StaffAssignmentWhereInput {
  const trimmed = query?.trim();
  const where: Prisma.StaffAssignmentWhereInput = Array.isArray(branchIds) ? { branchId: { in: branchIds } } : {};
  if (!trimmed) return where;

  const roleMatches = staffRoleMatches(trimmed);
  const statusMatches = staffStatusMatches(trimmed);

  return {
    ...where,
    OR: [
      { profile: { fullName: { contains: trimmed, mode: "insensitive" } } },
      { profile: { email: { contains: trimmed, mode: "insensitive" } } },
      { profile: { mobile: { contains: trimmed, mode: "insensitive" } } },
      { profile: { username: { contains: trimmed, mode: "insensitive" } } },
      { branch: { name: { contains: trimmed, mode: "insensitive" } } },
      { branch: { code: { contains: trimmed, mode: "insensitive" } } },
      ...roleMatches.map((role) => ({ role })),
      ...statusMatches.map((status) => ({ status })),
    ],
  };
}

function staffRoleMatches(query: string): AppRole[] {
  const normalized = normalizeStaffSearch(query);
  const matches: AppRole[] = [];
  if ("cashier".startsWith(normalized)) matches.push("CASHIER");
  if ("branch_admin".startsWith(normalized) || "branch admin".startsWith(query.trim().toLowerCase()) || normalized === "admin") {
    matches.push("BRANCH_ADMIN");
  }
  return matches;
}

function staffStatusMatches(query: string): StaffAssignmentStatus[] {
  const normalized = normalizeStaffSearch(query);
  const statuses: Array<{ label: string; value: StaffAssignmentStatus }> = [
    { label: "active", value: "ACTIVE" },
    { label: "inactive", value: "INACTIVE" },
    { label: "revoked", value: "REVOKED" },
  ];
  return statuses.filter((status) => status.label.startsWith(normalized)).map((status) => status.value);
}

function normalizeStaffSearch(value: string) {
  return value.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

export async function getStaffSetupData(branchIds?: string[]) {
  const scoped = Array.isArray(branchIds);
  const [branches, staffProfiles] = await Promise.all([
    getBranchSetupOptions(branchIds),
    prisma.userProfile.findMany({
      where: {
        OR: [
          { roles: { has: "CASHIER" } },
          { roles: { has: "BRANCH_ADMIN" } },
          { roles: { has: "SUPER_ADMIN" } },
        ],
        ...(scoped ? { staffAssignments: { some: { branchId: { in: branchIds } } } } : {}),
      },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return { branches, staffProfiles };
}

export async function createStaffAccountAction(formData: FormData) {
  const parsed = createStaffAccountSchema.parse(Object.fromEntries(formData.entries()));
  const actor = await requireStaffAccountManager(parsed.branchId, parsed.role);
  const syntheticEmail = staffEmailForUsername(parsed.username);

  const existingProfile = await prisma.userProfile.findFirst({
    where: { OR: [{ username: parsed.username }, { email: syntheticEmail }] },
    select: { id: true },
  });
  if (existingProfile) throw new Error("Username is already used by another account.");

  const result = await auth.signUp.email({
    email: syntheticEmail,
    password: parsed.password,
    name: parsed.fullName,
  });
  if (result.error) throw new Error(result.error.message);

  const authUser = result.data as unknown as { user?: { id?: string } };
  const authUserId = authUser.user?.id;
  if (!authUserId) throw new Error("Auth account was created, but no auth user id was returned.");

  const profile = await prisma.$transaction(async (tx) => {
    const created = await tx.userProfile.create({
      data: {
        authUserId,
        fullName: parsed.fullName,
        username: parsed.username,
        email: syntheticEmail,
        roles: [parsed.role],
      },
    });

    await tx.staffAssignment.create({
      data: {
        profileId: created.id,
        branchId: parsed.branchId,
        role: parsed.role,
        status: parsed.assignmentStatus,
      },
    });

    await tx.auditEvent.create({
      data: {
        actorId: actor.id,
        action: "STAFF_ACCOUNT_CREATED",
        metadata: {
          profileId: created.id,
          branchId: parsed.branchId,
          role: parsed.role,
          username: parsed.username,
        },
      },
    });

    return created;
  });

  revalidateStaffSetup(parsed.branchId, profile.id);
}

export async function createStaffAssignmentAction(formData: FormData) {
  const parsed = createStaffAssignmentSchema.parse(Object.fromEntries(formData.entries()));
  const actor = await requireStaffAccountManager(parsed.branchId, parsed.role);
  const profile = await prisma.userProfile.findUniqueOrThrow({ where: { id: parsed.profileId } });

  await prisma.$transaction(async (tx) => {
    await tx.userProfile.update({
      where: { id: profile.id },
      data: { roles: Array.from(new Set([...profile.roles, parsed.role])) },
    });

    await tx.staffAssignment.upsert({
      where: {
        profileId_branchId_role: {
          profileId: profile.id,
          branchId: parsed.branchId,
          role: parsed.role,
        },
      },
      update: { status: parsed.status },
      create: {
        profileId: profile.id,
        branchId: parsed.branchId,
        role: parsed.role,
        status: parsed.status,
      },
    });

    await tx.auditEvent.create({
      data: {
        actorId: actor.id,
        action: "STAFF_ASSIGNMENT_CREATED",
        metadata: {
          profileId: profile.id,
          branchId: parsed.branchId,
          role: parsed.role,
          status: parsed.status,
        },
      },
    });
  });

  revalidateStaffSetup(parsed.branchId, profile.id);
}

export async function updateStaffAssignmentStatusAction(formData: FormData) {
  const parsed = updateStaffAssignmentStatusSchema.parse(Object.fromEntries(formData.entries()));
  const assignment = await prisma.staffAssignment.findUniqueOrThrow({
    where: { id: parsed.assignmentId },
    include: { profile: true },
  });
  const actor = await requireAssignmentManager(assignment.branchId, assignment.role);

  const updated = await prisma.staffAssignment.update({
    where: { id: assignment.id },
    data: { status: parsed.status },
  });

  await prisma.auditEvent.create({
    data: {
      actorId: actor.id,
      action: "STAFF_ASSIGNMENT_STATUS_UPDATED",
      metadata: {
        assignmentId: assignment.id,
        profileId: assignment.profileId,
        branchId: assignment.branchId,
        role: assignment.role,
        previousStatus: assignment.status,
        nextStatus: updated.status,
      },
    },
  });
  await syncStaffRoleForProfile(assignment.profileId, assignment.role);
  revalidateStaffSetup(assignment.branchId, assignment.profileId);
}

export async function removeStaffAssignmentAction(formData: FormData) {
  const parsed = removeStaffAssignmentSchema.parse(Object.fromEntries(formData.entries()));
  const assignment = await prisma.staffAssignment.findUniqueOrThrow({
    where: { id: parsed.assignmentId },
    include: { profile: true },
  });
  const actor = await requireAssignmentManager(assignment.branchId, assignment.role);
  if (actor.id === assignment.profileId) throw new Error("You cannot remove your own staff assignment.");

  await prisma.$transaction(async (tx) => {
    await tx.staffAssignment.delete({ where: { id: assignment.id } });
    await tx.auditEvent.create({
      data: {
        actorId: actor.id,
        action: "STAFF_ASSIGNMENT_REMOVED",
        metadata: {
          assignmentId: assignment.id,
          profileId: assignment.profileId,
          branchId: assignment.branchId,
          role: assignment.role,
          previousStatus: assignment.status,
        },
      },
    });
  });

  await syncStaffRoleForProfile(assignment.profileId, assignment.role);
  revalidateStaffSetup(assignment.branchId, assignment.profileId);
}

export async function deleteStaffAccountAction(formData: FormData) {
  const parsed = deleteStaffAccountSchema.parse(Object.fromEntries(formData.entries()));
  const target = await prisma.userProfile.findUniqueOrThrow({
    where: { id: parsed.profileId },
    include: {
      staffAssignments: true,
      _count: { select: { cashierVisits: true } },
    },
  });
  const actor = await requireStaffProfileDeletionManager(target);
  if (actor.id === target.id) throw new Error("You cannot delete your own staff account.");
  if (target.roles.includes("CUSTOMER")) throw new Error("This profile is also a customer. Remove only the staff assignment.");
  if (target._count.cashierVisits > 0) throw new Error("This staff account has scan history. Remove assignments instead.");

  const canDeleteAllAssignments = target.staffAssignments.every((assignment) => canManageStaffAssignment(actor, assignment.branchId, assignment.role));
  if (!canDeleteAllAssignments) throw new Error("You can only delete staff accounts fully within your managed scope.");

  const authResult = await auth.admin.removeUser({ userId: target.authUserId });
  if (authResult.error) throw new Error(authResult.error.message ?? "Unable to delete the auth account.");

  await prisma.$transaction(async (tx) => {
    await tx.userProfile.delete({ where: { id: target.id } });
    await tx.auditEvent.create({
      data: {
        actorId: actor.id,
        action: "STAFF_ACCOUNT_DELETED",
        metadata: {
          profileId: target.id,
          authUserId: target.authUserId,
          roles: target.roles,
          assignments: target.staffAssignments.map((assignment) => ({
            branchId: assignment.branchId,
            role: assignment.role,
            status: assignment.status,
          })),
        },
      },
    });
  });

  revalidateAdmin();
  revalidatePath("/admin/staff");
  for (const assignment of target.staffAssignments) {
    revalidateBranchSetup(assignment.branchId);
  }
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

export type MemberManagementOptions = {
  branchIds?: string[];
  query?: string;
  status?: "all" | "ACTIVE" | "INACTIVE" | "SUSPENDED";
  branchId?: string;
  cardStatus?: "all" | "ACTIVE" | "BLOCKED";
  tier?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
};

function memberIncludeFor(options: MemberManagementOptions = {}): Prisma.UserProfileInclude {
  const visitWhere = memberVisitWhere(options);

  return {
    loyaltyCard: true,
    visits: {
      where: visitWhere,
      orderBy: { scannedAt: "desc" },
      take: 1,
      include: { branch: true },
    },
    _count: {
      select: {
        visits: { where: visitWhere },
      },
    },
  };
}

export async function getMemberManagementData(options: MemberManagementOptions = {}) {
  const pageSize = normalizePageSize(options.pageSize, 8);
  const page = normalizePage(options.page);
  const dates = defaultDateRange();
  const normalizedOptions = {
    ...options,
    dateFrom: options.dateFrom ?? dates.dateFrom,
    dateTo: options.dateTo ?? dates.dateTo,
  };
  const scopedWhere = memberScopeWhere(options.branchIds);
  const where = memberManagementWhere(options);

  const [totalFiltered, scopedMembers, branches, tiers] = await Promise.all([
    prisma.userProfile.count({ where }),
    prisma.userProfile.findMany({
      where: scopedWhere,
      include: { loyaltyCard: true },
    }),
    getBranchSetupOptions(options.branchIds),
    prisma.loyaltyCard.findMany({
      where: {
        profile: scopedWhere,
      },
      select: { tier: true },
      distinct: ["tier"],
      orderBy: { tier: "asc" },
    }),
  ]);

  const pageCount = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const currentPage = Math.min(page, pageCount);
  const members = await prisma.userProfile.findMany({
    where,
    include: memberIncludeFor(normalizedOptions),
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
  });

  return {
    members,
    branches,
    tiers: tiers.map((item) => item.tier),
    filters: {
      query: options.query?.trim() ?? "",
      status: options.status ?? "all",
      branchId: options.branchId ?? "all",
      cardStatus: options.cardStatus ?? "all",
      tier: options.tier ?? "all",
      dateFrom: normalizedOptions.dateFrom,
      dateTo: normalizedOptions.dateTo,
    },
    metrics: {
      total: scopedMembers.length,
      active: scopedMembers.filter((member) => member.status === "ACTIVE").length,
      blockedCards: scopedMembers.filter((member) => member.loyaltyCard?.status === "BLOCKED").length,
      totalPoints: scopedMembers.reduce((sum, member) => sum + (member.loyaltyCard?.pointsBalance ?? 0), 0),
    },
    pagination: paginationPayload(totalFiltered, currentPage, pageSize),
  };
}

export async function getMemberExportRows(options: MemberManagementOptions = {}) {
  const dates = defaultDateRange();
  const normalizedOptions = {
    ...options,
    dateFrom: options.dateFrom ?? dates.dateFrom,
    dateTo: options.dateTo ?? dates.dateTo,
  };

  return prisma.userProfile.findMany({
    where: memberManagementWhere(options),
    include: memberIncludeFor(normalizedOptions),
    orderBy: { createdAt: "desc" },
  });
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

function branchScopeWhere(branchIds?: string[], query?: string): Prisma.BranchWhereInput {
  const trimmed = query?.trim();
  return {
    ...(Array.isArray(branchIds) ? { id: { in: branchIds } } : {}),
    ...(trimmed
      ? {
          OR: [
            { code: { contains: trimmed, mode: "insensitive" } },
            { name: { contains: trimmed, mode: "insensitive" } },
            { address: { contains: trimmed, mode: "insensitive" } },
            { phone: { contains: trimmed, mode: "insensitive" } },
            { email: { contains: trimmed, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

function approvalBaseWhere(options: ApprovalManagementOptions): Prisma.VisitWhereInput {
  const trimmed = options.query?.trim();
  const range = dateRangeFor(options.dateFrom, options.dateTo);
  return {
    ...(Array.isArray(options.branchIds) ? { branchId: { in: options.branchIds } } : {}),
    scannedAt: { gte: range.start, lt: range.end },
    ...(trimmed
      ? {
          OR: [
            { id: { contains: trimmed, mode: "insensitive" } },
            { reason: { contains: trimmed, mode: "insensitive" } },
            { customer: { fullName: { contains: trimmed, mode: "insensitive" } } },
            { customer: { email: { contains: trimmed, mode: "insensitive" } } },
            { customer: { mobile: { contains: trimmed, mode: "insensitive" } } },
            { cashier: { fullName: { contains: trimmed, mode: "insensitive" } } },
            { cashier: { email: { contains: trimmed, mode: "insensitive" } } },
            { branch: { name: { contains: trimmed, mode: "insensitive" } } },
            { branch: { code: { contains: trimmed, mode: "insensitive" } } },
            { loyaltyCard: { cardNumber: { contains: trimmed, mode: "insensitive" } } },
          ],
        }
      : {}),
  };
}

function approvalStatusWhere(status: ApprovalManagementOptions["status"]): Prisma.VisitWhereInput {
  if (status === "pending") return { status: "PENDING" };
  if (status === "approved") return { status: { in: ["APPROVED", "AUTO_APPROVED"] } };
  if (status === "rejected") return { status: "REJECTED" };
  return {};
}

async function getApprovalTabCounts(baseWhere: Prisma.VisitWhereInput) {
  const [all, pending, approved, rejected] = await Promise.all([
    prisma.visit.count({ where: baseWhere }),
    prisma.visit.count({ where: { ...baseWhere, status: "PENDING" } }),
    prisma.visit.count({ where: { ...baseWhere, status: { in: ["APPROVED", "AUTO_APPROVED"] } } }),
    prisma.visit.count({ where: { ...baseWhere, status: "REJECTED" } }),
  ]);
  return { all, pending, approved, rejected };
}

function memberScopeWhere(branchIds?: string[]): Prisma.UserProfileWhereInput {
  return {
    roles: { has: "CUSTOMER" },
    ...(Array.isArray(branchIds) ? { visits: { some: { branchId: { in: branchIds } } } } : {}),
  };
}

function memberManagementWhere(options: MemberManagementOptions): Prisma.UserProfileWhereInput {
  const trimmed = options.query?.trim();
  const scopedBranchIds = memberBranchScope(options.branchIds, options.branchId);
  const loyaltyCardFilters = {
    ...(options.cardStatus && options.cardStatus !== "all" ? { status: options.cardStatus } : {}),
    ...(options.tier && options.tier !== "all" ? { tier: options.tier } : {}),
  };

  return {
    roles: { has: "CUSTOMER" },
    ...(scopedBranchIds ? { visits: { some: { branchId: { in: scopedBranchIds } } } } : {}),
    ...(options.status && options.status !== "all" ? { status: options.status } : {}),
    ...(Object.keys(loyaltyCardFilters).length ? { loyaltyCard: { is: loyaltyCardFilters } } : {}),
    ...(trimmed
      ? {
          OR: [
            { fullName: { contains: trimmed, mode: "insensitive" } },
            { email: { contains: trimmed, mode: "insensitive" } },
            { mobile: { contains: trimmed, mode: "insensitive" } },
            { username: { contains: trimmed, mode: "insensitive" } },
            { loyaltyCard: { is: { cardNumber: { contains: trimmed, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };
}

function memberBranchScope(branchIds?: string[], selectedBranchId?: string) {
  if (selectedBranchId && selectedBranchId !== "all") {
    if (Array.isArray(branchIds) && !branchIds.includes(selectedBranchId)) return [];
    return [selectedBranchId];
  }
  return Array.isArray(branchIds) ? branchIds : undefined;
}

function memberVisitWhere(options: MemberManagementOptions): Prisma.VisitWhereInput {
  const scopedBranchIds = memberBranchScope(options.branchIds, options.branchId);
  const range = dateRangeFor(options.dateFrom, options.dateTo);

  return {
    ...(scopedBranchIds ? { branchId: { in: scopedBranchIds } } : {}),
    scannedAt: { gte: range.start, lt: range.end },
  };
}

function defaultDateRange() {
  const today = new Date();
  const dateTo = formatDateInput(today);
  const start = new Date(today);
  start.setDate(start.getDate() - 6);
  return { dateFrom: formatDateInput(start), dateTo };
}

function dateRangeFor(dateFrom?: string, dateTo?: string) {
  const dates = defaultDateRange();
  const from = dateFrom || dates.dateFrom;
  const to = dateTo || dates.dateTo;
  const end = new Date(`${to}T00:00:00+08:00`);
  end.setDate(end.getDate() + 1);
  return {
    start: new Date(`${from}T00:00:00+08:00`),
    end,
  };
}

function formatDateInput(value: Date) {
  return value.toISOString().slice(0, 10);
}

function paginationPayload(total: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
    total,
    from: total ? (page - 1) * pageSize + 1 : 0,
    to: Math.min(page * pageSize, total),
  };
}

function normalizePage(value?: number) {
  const page = Number.isFinite(value) ? value ?? 1 : 1;
  return Math.max(1, Math.floor(page));
}

function normalizePageSize(value?: number, fallback = 10) {
  if (value === 7 || value === 8 || value === 10 || value === 20 || value === 50) return value;
  return fallback;
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

async function requireSuperAdmin() {
  const profile = await requireBranchScopedProfile();
  if (!profile.roles.includes("SUPER_ADMIN")) throw new Error("Only Super Admin can perform this action.");
  return profile;
}

async function requireBranchManager(branchId: string) {
  const profile = await requireBranchScopedProfile(branchId);
  if (profile.roles.includes("SUPER_ADMIN")) return profile;
  const branchIds = branchIdsForAdmin(profile);
  if (!branchIds?.includes(branchId)) throw new Error("You do not have permission to manage this branch.");
  return profile;
}

async function requireStaffAccountManager(branchId: string, role: AppRole) {
  const profile = await requireBranchManager(branchId);
  if (profile.roles.includes("SUPER_ADMIN")) return profile;
  if (role !== "CASHIER") throw new Error("Branch Admin can only create cashier accounts.");
  return profile;
}

async function requireAssignmentManager(branchId: string, role: AppRole) {
  const profile = await requireBranchManager(branchId);
  if (profile.roles.includes("SUPER_ADMIN")) return profile;
  if (role !== "CASHIER") throw new Error("Branch Admin can only manage cashier assignments.");
  return profile;
}

async function requireStaffProfileDeletionManager(target: { staffAssignments: Array<{ branchId: string; role: AppRole }> }) {
  const profile = await requireBranchScopedProfile();
  if (profile.roles.includes("SUPER_ADMIN")) return profile;
  if (!target.staffAssignments.length) throw new Error("This profile has no staff assignments to manage.");
  const canManageEveryAssignment = target.staffAssignments.every((assignment) => canManageStaffAssignment(profile, assignment.branchId, assignment.role));
  if (!canManageEveryAssignment) throw new Error("Branch Admin can only delete cashier staff within assigned branches.");
  return profile;
}

function canManageStaffAssignment(profile: { roles: AppRole[]; staffAssignments: Array<{ branchId: string; role: AppRole; status: string }> }, branchId: string, role: AppRole) {
  if (profile.roles.includes("SUPER_ADMIN")) return true;
  if (role !== "CASHIER") return false;
  return profile.staffAssignments.some(
    (assignment) => assignment.branchId === branchId && assignment.role === "BRANCH_ADMIN" && assignment.status === "ACTIVE",
  );
}

async function syncStaffRoleForProfile(profileId: string, role: AppRole) {
  const [profile, activeRoleAssignments] = await Promise.all([
    prisma.userProfile.findUniqueOrThrow({ where: { id: profileId }, select: { roles: true } }),
    prisma.staffAssignment.count({ where: { profileId, role, status: "ACTIVE" } }),
  ]);
  const nextRoles = activeRoleAssignments > 0
    ? Array.from(new Set([...profile.roles, role]))
    : profile.roles.filter((item) => item !== role);
  if (nextRoles.length !== profile.roles.length || nextRoles.some((item, index) => item !== profile.roles[index])) {
    await prisma.userProfile.update({ where: { id: profileId }, data: { roles: nextRoles } });
  }
}

function staffEmailForUsername(username: string) {
  return `${username}@staff.local`;
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

function revalidateBranchSetup(branchId: string) {
  revalidateAdmin();
  revalidatePath("/admin/branches");
  revalidatePath(`/admin/branches/${branchId}`);
  revalidatePath("/cashier/scan");
}

function revalidateStaffSetup(branchId: string, profileId?: string) {
  revalidateBranchSetup(branchId);
  revalidatePath("/admin/staff");
  if (profileId) {
    revalidatePath(`/admin/members/${profileId}`);
  }
}

function revalidateAdmin() {
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/staff");
  revalidatePath("/admin/members");
  revalidatePath("/admin/branches");
  revalidatePath("/super-admin/dashboard");
}

function branchActionError(error: unknown): BranchActionState {
  if (
    error &&
    typeof error === "object" &&
    "flatten" in error &&
    typeof error.flatten === "function"
  ) {
    const flattened = error.flatten() as { fieldErrors?: Record<string, string[] | undefined> };
    return { errors: flattened.fieldErrors, message: "Please check the branch form." };
  }

  if (error instanceof Error) return { message: error.message };
  return { message: "Branch action failed. Please try again." };
}

