import { z } from "zod";

export const rejectVisitSchema = z.object({
  visitId: z.string().min(1),
  reason: z.string().min(3, "A rejection reason is required."),
});

export const approveVisitSchema = z.object({
  visitId: z.string().min(1),
  override: z.coerce.boolean().optional(),
});

