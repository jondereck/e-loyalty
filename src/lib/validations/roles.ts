import { z } from "zod";
import { roleModuleKeys } from "@/lib/rbac";

const roleModuleEnum = z.enum(roleModuleKeys);

export const createRoleSchema = z.object({
  name: z.string().trim().min(2, "Role name is required.").max(80),
  description: z.string().trim().min(3, "Description is required.").max(240),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
  defaultModule: roleModuleEnum,
  modules: z.array(roleModuleEnum).min(1, "Select at least one module."),
}).superRefine((value, ctx) => {
  if (!value.modules.includes(value.defaultModule)) {
    ctx.addIssue({
      code: "custom",
      path: ["defaultModule"],
      message: "Default landing page must be an enabled module.",
    });
  }
});

export const updateRolePermissionsSchema = createRoleSchema.extend({
  roleId: z.string().min(1),
});

export const duplicateRoleSchema = z.object({
  roleId: z.string().min(1),
});

export const disableRoleSchema = z.object({
  roleId: z.string().min(1),
});

export type RoleFormInput = z.input<typeof createRoleSchema>;
export type RoleUpdateInput = z.input<typeof updateRolePermissionsSchema>;
