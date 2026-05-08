import { z } from "zod";

export const rejectVisitSchema = z.object({
  visitId: z.string().min(1),
  reason: z.string().trim().min(3, "A rejection reason is required.").max(500),
  adminNote: z.string().trim().max(500).optional().transform((value) => value || null),
});

export const approveVisitSchema = z.object({
  visitId: z.string().min(1),
  override: z.coerce.boolean().optional(),
  adminNote: z.string().trim().max(500).optional().transform((value) => value || null),
});

export const updateCardStatusSchema = z.object({
  profileId: z.string().min(1),
  status: z.enum(["ACTIVE", "BLOCKED"]),
});

export const updateMemberProfileStatusSchema = z.object({
  profileId: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]),
});

export const adjustMemberPointsSchema = z.object({
  profileId: z.string().min(1),
  points: z.coerce.number().int().min(-100000).max(100000).refine((value) => value !== 0, "Point adjustment cannot be zero."),
  reason: z.string().trim().min(3, "A reason is required."),
});

export const createBranchSchema = z.object({
  code: z.string().trim().min(2, "Branch code is required.").max(20).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2, "Branch name is required.").max(120),
  address: z.string().trim().max(240).optional().transform((value) => value || null),
  phone: z.string().trim().max(40).optional().transform((value) => value || null),
  email: z.string().trim().max(120).optional().transform((value) => value || null).pipe(z.string().email("Enter a valid email.").nullable()),
  status: z.enum(["ACTIVE", "INACTIVE", "MAINTENANCE"]).default("ACTIVE"),
});

export const updateBranchSchema = createBranchSchema.extend({
  branchId: z.string().min(1),
});

export const createStaffAccountSchema = z.object({
  fullName: z.string().trim().min(2, "Staff name is required.").max(120),
  username: z.string().trim().toLowerCase().min(3, "Username must be at least 3 characters.").max(40).regex(/^[a-z0-9._-]+$/, "Use letters, numbers, dots, dashes, or underscores only."),
  password: z.string().min(8, "Temporary password must be at least 8 characters."),
  branchId: z.string().min(1),
  role: z.enum(["CASHIER", "BRANCH_ADMIN"]),
  assignmentStatus: z.enum(["ACTIVE", "INACTIVE", "REVOKED"]).default("ACTIVE"),
});

export const createStaffAssignmentSchema = z.object({
  profileId: z.string().min(1),
  branchId: z.string().min(1),
  role: z.enum(["CASHIER", "BRANCH_ADMIN"]),
  status: z.enum(["ACTIVE", "INACTIVE", "REVOKED"]).default("ACTIVE"),
});

export const updateStaffAssignmentStatusSchema = z.object({
  assignmentId: z.string().min(1),
  status: z.enum(["ACTIVE", "INACTIVE", "REVOKED"]),
});

export const removeStaffAssignmentSchema = z.object({
  assignmentId: z.string().min(1),
});

export const deleteStaffAccountSchema = z.object({
  profileId: z.string().min(1),
});

