import { z } from "zod";

export const rejectVisitSchema = z.object({
  visitId: z.string().min(1),
  reason: z.string().min(3, "A rejection reason is required."),
});

export const approveVisitSchema = z.object({
  visitId: z.string().min(1),
  override: z.coerce.boolean().optional(),
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

