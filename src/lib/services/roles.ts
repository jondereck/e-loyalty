import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { AppRole, RoleModuleKey } from "@/generated/prisma/client";
import type { AdminMutationResult } from "@/lib/admin/mutations";
import { adminMutationError } from "@/lib/admin/mutations";
import { prisma } from "@/lib/prisma";
import {
  allModuleKeys,
  baseRoleForModules,
  coerceEnabledDefaultModule,
  defaultRoleConfigs,
  isProtectedSystemRoleKey,
  normalizeRoleName,
  roleModules,
  type RoleModuleKey as AppRoleModuleKey,
} from "@/lib/rbac";
import { requireProfile } from "@/lib/services/session";
import {
  createRoleSchema,
  disableRoleSchema,
  duplicateRoleSchema,
  updateRolePermissionsSchema,
  type RoleFormInput,
  type RoleUpdateInput,
} from "@/lib/validations/roles";

export type RoleOption = {
  id: string;
  name: string;
  baseRole: AppRole;
  systemRole: AppRole | null;
};

export type RoleManagementItem = {
  id: string;
  name: string;
  description: string;
  status: "ACTIVE" | "INACTIVE";
  baseRole: AppRole;
  systemRole: AppRole | null;
  defaultModule: AppRoleModuleKey;
  protected: boolean;
  modules: AppRoleModuleKey[];
  enabledModulesCount: number;
  assignedUsersCount: number;
};

export type RoleManagementData = {
  roles: RoleManagementItem[];
  modules: typeof roleModules;
};

export async function ensureDefaultAccessRoles() {
  for (const config of defaultRoleConfigs) {
    const existing = await prisma.accessRole.findUnique({ where: { key: config.key }, select: { id: true } });
    const role = existing
      ? await prisma.accessRole.update({
          where: { id: existing.id },
          data: config.protected
            ? {
                name: config.name,
                normalizedName: config.normalizedName,
                description: config.description,
                status: "ACTIVE",
                baseRole: config.baseRole,
                systemRole: config.systemRole,
                defaultModule: config.defaultModule as RoleModuleKey,
                protected: true,
              }
            : { protected: false },
          select: { id: true },
        })
      : await prisma.accessRole.create({
          data: {
            id: `role-${config.key.toLowerCase().replaceAll("_", "-")}`,
            key: config.key,
            name: config.name,
            normalizedName: config.normalizedName,
            description: config.description,
            status: "ACTIVE",
            baseRole: config.baseRole,
            systemRole: config.systemRole,
            defaultModule: config.defaultModule as RoleModuleKey,
            protected: config.protected,
            permissions: {
              create: config.modules.map((module) => ({ module: module as RoleModuleKey })),
            },
          },
          select: { id: true },
        });

    if (config.protected) {
      await prisma.$transaction(async (tx) => {
        await tx.rolePermission.deleteMany({ where: { roleId: role.id } });
        await tx.rolePermission.createMany({
          data: config.modules.map((module) => ({ roleId: role.id, module: module as RoleModuleKey })),
          skipDuplicates: true,
        });
      });
    }
  }
}

export async function getRoleManagementData(): Promise<RoleManagementData> {
  await ensureDefaultAccessRoles();
  const roles = await prisma.accessRole.findMany({
    include: { permissions: { orderBy: { module: "asc" } } },
    orderBy: [{ protected: "desc" }, { name: "asc" }],
  });
  const assignedCounts = await assignedUserCounts(roles.map((role) => role.id));

  return {
    roles: roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      status: role.status,
      baseRole: role.baseRole,
      systemRole: role.systemRole,
      defaultModule: role.defaultModule as AppRoleModuleKey,
      protected: role.protected,
      modules: role.permissions.map((permission) => permission.module as AppRoleModuleKey),
      enabledModulesCount: role.permissions.length,
      assignedUsersCount: assignedCounts.get(role.id) ?? 0,
    })),
    modules: roleModules,
  };
}

export async function getAssignableStaffRoles(isSuperAdmin: boolean): Promise<RoleOption[]> {
  await ensureDefaultAccessRoles();
  const roles = await prisma.accessRole.findMany({
    where: {
      status: "ACTIVE",
      systemRole: isSuperAdmin ? { not: "SUPER_ADMIN" } : "CASHIER",
      ...(isSuperAdmin ? {} : { baseRole: "CASHIER" as const }),
    },
    orderBy: [{ protected: "desc" }, { name: "asc" }],
    select: { id: true, name: true, baseRole: true, systemRole: true },
  });

  if (!isSuperAdmin) {
    return roles.filter((role) => role.baseRole === "CASHIER");
  }

  return roles;
}

export async function createRoleAction(input: RoleFormInput): Promise<AdminMutationResult<RoleManagementData>> {
  try {
    const actor = await requireProfile(["SUPER_ADMIN"]);
    const parsed = createRoleSchema.parse(input);
    const modules = uniqueModules(parsed.modules);
    const normalizedName = normalizeRoleName(parsed.name);
    if (isProtectedSystemRoleKey(parsed.name) || isProtectedSystemRoleKey(normalizedName)) {
      throw new Error("That role name is reserved for a protected system role.");
    }
    await assertRoleNameAvailable(normalizedName);

    await prisma.$transaction(async (tx) => {
      const role = await tx.accessRole.create({
        data: {
          key: customRoleKey(parsed.name),
          name: parsed.name,
          normalizedName,
          description: parsed.description,
          status: parsed.status,
          baseRole: baseRoleForModules(modules),
          defaultModule: coerceEnabledDefaultModule(modules, parsed.defaultModule) as RoleModuleKey,
          protected: false,
          permissions: {
            create: modules.map((module) => ({ module: module as RoleModuleKey })),
          },
        },
      });
      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          action: "ROLE_CREATED",
          metadata: { roleId: role.id, name: role.name, modules },
        },
      });
      return role;
    });

    revalidateRolePaths();
    return { ok: true, message: "Role created.", data: await getRoleManagementData() };
  } catch (error) {
    return adminMutationError(error, "Role could not be created.");
  }
}

export async function updateRolePermissionsAction(input: RoleUpdateInput): Promise<AdminMutationResult<RoleManagementData>> {
  try {
    const actor = await requireProfile(["SUPER_ADMIN"]);
    const parsed = updateRolePermissionsSchema.parse(input);
    const modules = uniqueModules(parsed.modules);
    const existing = await prisma.accessRole.findUniqueOrThrow({
      where: { id: parsed.roleId },
      include: { permissions: true },
    });
    const normalizedName = normalizeRoleName(parsed.name);

    if (existing.protected) {
      if (parsed.name !== existing.name || parsed.status !== "ACTIVE") {
        throw new Error("Protected system roles cannot be renamed or disabled.");
      }
      const requiredModules = existing.systemRole ? modulesForProtectedRole(existing.systemRole) : [];
      if (requiredModules.some((module) => !modules.includes(module))) {
        throw new Error("Protected system role modules cannot be removed.");
      }
    } else {
      await assertRoleNameAvailable(normalizedName, existing.id);
    }

    await prisma.$transaction(async (tx) => {
      await tx.accessRole.update({
        where: { id: existing.id },
        data: {
          name: existing.protected ? existing.name : parsed.name,
          normalizedName: existing.protected ? existing.normalizedName : normalizedName,
          description: parsed.description,
          status: existing.protected ? "ACTIVE" : parsed.status,
          baseRole: existing.protected ? existing.baseRole : baseRoleForModules(modules),
          defaultModule: coerceEnabledDefaultModule(modules, parsed.defaultModule) as RoleModuleKey,
        },
      });
      await tx.rolePermission.deleteMany({ where: { roleId: existing.id } });
      await tx.rolePermission.createMany({
        data: modules.map((module) => ({ roleId: existing.id, module: module as RoleModuleKey })),
        skipDuplicates: true,
      });
      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          action: "ROLE_PERMISSIONS_UPDATED",
          metadata: {
            roleId: existing.id,
            previousModules: existing.permissions.map((permission) => permission.module),
            nextModules: modules,
          },
        },
      });
    });

    await syncAssignmentsForRole(existing.id);
    revalidateRolePaths();
    return { ok: true, message: "Role permissions saved.", data: await getRoleManagementData() };
  } catch (error) {
    return adminMutationError(error, "Role permissions could not be saved.");
  }
}

export async function duplicateRoleAction(input: z.input<typeof duplicateRoleSchema>): Promise<AdminMutationResult<RoleManagementData>> {
  try {
    const actor = await requireProfile(["SUPER_ADMIN"]);
    const parsed = duplicateRoleSchema.parse(input);
    const source = await prisma.accessRole.findUniqueOrThrow({
      where: { id: parsed.roleId },
      include: { permissions: true },
    });
    const name = await nextDuplicateName(source.name);
    const modules = source.permissions.map((permission) => permission.module as AppRoleModuleKey);

    await prisma.$transaction(async (tx) => {
      const created = await tx.accessRole.create({
        data: {
          key: customRoleKey(name),
          name,
          normalizedName: normalizeRoleName(name),
          description: source.description,
          status: "ACTIVE",
          baseRole: source.baseRole,
          defaultModule: coerceEnabledDefaultModule(modules, source.defaultModule as AppRoleModuleKey) as RoleModuleKey,
          protected: false,
          permissions: {
            create: modules.map((module) => ({ module: module as RoleModuleKey })),
          },
        },
      });
      await tx.auditEvent.create({
        data: {
          actorId: actor.id,
          action: "ROLE_DUPLICATED",
          metadata: { sourceRoleId: source.id, roleId: created.id, name },
        },
      });
    });

    revalidateRolePaths();
    return { ok: true, message: "Role duplicated.", data: await getRoleManagementData() };
  } catch (error) {
    return adminMutationError(error, "Role could not be duplicated.");
  }
}

export async function disableRoleAction(input: z.input<typeof disableRoleSchema>): Promise<AdminMutationResult<RoleManagementData>> {
  try {
    const actor = await requireProfile(["SUPER_ADMIN"]);
    const parsed = disableRoleSchema.parse(input);
    const role = await prisma.accessRole.findUniqueOrThrow({ where: { id: parsed.roleId } });
    if (role.protected) throw new Error("Protected system roles cannot be disabled.");

    await prisma.$transaction([
      prisma.accessRole.update({ where: { id: role.id }, data: { status: "INACTIVE" } }),
      prisma.auditEvent.create({
        data: {
          actorId: actor.id,
          action: "ROLE_DISABLED",
          metadata: { roleId: role.id, name: role.name },
        },
      }),
    ]);

    revalidateRolePaths();
    return { ok: true, message: "Role disabled.", data: await getRoleManagementData() };
  } catch (error) {
    return adminMutationError(error, "Role could not be disabled.");
  }
}

export async function resolveAssignableRole(roleId: string, isSuperAdmin: boolean) {
  const role = await prisma.accessRole.findFirst({
    where: {
      id: roleId,
      status: "ACTIVE",
      systemRole: isSuperAdmin ? { not: "SUPER_ADMIN" } : "CASHIER",
      ...(isSuperAdmin ? {} : { baseRole: "CASHIER" as const }),
    },
    select: { id: true, baseRole: true },
  });
  if (!role) throw new Error("Selected role is not active or assignable.");
  return role;
}

async function assignedUserCounts(roleIds: string[]) {
  const result = new Map<string, number>();
  await Promise.all(
    roleIds.map(async (roleId) => {
      const users = await prisma.staffAssignment.findMany({
        where: { roleId },
        select: { profileId: true },
        distinct: ["profileId"],
      });
      result.set(roleId, users.length);
    }),
  );
  return result;
}

async function assertRoleNameAvailable(normalizedName: string, ignoreRoleId?: string) {
  const existing = await prisma.accessRole.findUnique({ where: { normalizedName }, select: { id: true } });
  if (existing && existing.id !== ignoreRoleId) throw new Error("A role with that name already exists.");
}

function uniqueModules(modules: AppRoleModuleKey[]) {
  return Array.from(new Set(modules)).filter((module) => allModuleKeys.includes(module));
}

function customRoleKey(name: string) {
  const slug = normalizeRoleName(name).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return `CUSTOM_${slug.toUpperCase()}_${Date.now()}`;
}

function modulesForProtectedRole(role: AppRole) {
  return defaultRoleConfigs.find((config) => config.systemRole === role)?.modules.slice() ?? [];
}

async function nextDuplicateName(name: string) {
  for (let index = 1; index < 100; index += 1) {
    const candidate = `${name} Copy${index === 1 ? "" : ` ${index}`}`;
    const existing = await prisma.accessRole.findUnique({
      where: { normalizedName: normalizeRoleName(candidate) },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  return `${name} Copy ${Date.now()}`;
}

async function syncAssignmentsForRole(roleId: string) {
  const role = await prisma.accessRole.findUniqueOrThrow({ where: { id: roleId }, select: { baseRole: true } });
  const assignments = await prisma.staffAssignment.findMany({
    where: { roleId },
    select: { id: true, profileId: true, role: true },
  });

  await prisma.$transaction(async (tx) => {
    for (const assignment of assignments) {
      if (assignment.role !== role.baseRole) {
        await tx.staffAssignment.update({ where: { id: assignment.id }, data: { role: role.baseRole } });
      }
    }
  });

  await Promise.all(Array.from(new Set(assignments.map((assignment) => assignment.profileId))).map(syncStaffRolesForProfile));
}

async function syncStaffRolesForProfile(profileId: string) {
  const [profile, activeAssignments] = await Promise.all([
    prisma.userProfile.findUniqueOrThrow({ where: { id: profileId }, select: { roles: true } }),
    prisma.staffAssignment.findMany({ where: { profileId, status: "ACTIVE" }, select: { role: true } }),
  ]);
  const assignmentRoles = new Set(activeAssignments.map((assignment) => assignment.role));
  const retained = profile.roles.filter((role) => role === "CUSTOMER" || role === "SUPER_ADMIN" || assignmentRoles.has(role));
  const nextRoles = Array.from(new Set([...retained, ...assignmentRoles]));
  if (nextRoles.length !== profile.roles.length || nextRoles.some((role, index) => role !== profile.roles[index])) {
    await prisma.userProfile.update({ where: { id: profileId }, data: { roles: nextRoles } });
  }
}

function revalidateRolePaths() {
  [
    "/super-admin/settings",
    "/admin/dashboard",
    "/admin/members",
    "/admin/approvals",
    "/admin/staff",
    "/admin/branches",
    "/admin/reports",
    "/super-admin/reports",
    "/cashier/scan",
  ].forEach((path) => revalidatePath(path));
}
