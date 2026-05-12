-- CreateEnum
CREATE TYPE "RoleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RoleModuleKey" AS ENUM (
  'OVERVIEW',
  'MEMBERS',
  'APPROVALS',
  'STAFF',
  'BRANCHES',
  'REPORTS',
  'SYSTEM_REPORTS',
  'SETTINGS',
  'SCAN',
  'ROLES_PERMISSIONS'
);

-- AlterTable
ALTER TABLE "StaffAssignment"
ADD COLUMN "roleId" TEXT;

-- CreateTable
CREATE TABLE "AccessRole" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "status" "RoleStatus" NOT NULL DEFAULT 'ACTIVE',
  "baseRole" "AppRole" NOT NULL,
  "systemRole" "AppRole",
  "defaultModule" "RoleModuleKey" NOT NULL,
  "protected" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "AccessRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
  "id" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "module" "RoleModuleKey" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessRole_key_key" ON "AccessRole"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AccessRole_normalizedName_key" ON "AccessRole"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_module_key" ON "RolePermission"("roleId", "module");

-- CreateIndex
CREATE INDEX "RolePermission_module_idx" ON "RolePermission"("module");

-- CreateIndex
CREATE INDEX "StaffAssignment_roleId_idx" ON "StaffAssignment"("roleId");

-- AddForeignKey
ALTER TABLE "RolePermission"
ADD CONSTRAINT "RolePermission_roleId_fkey"
FOREIGN KEY ("roleId") REFERENCES "AccessRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAssignment"
ADD CONSTRAINT "StaffAssignment_roleId_fkey"
FOREIGN KEY ("roleId") REFERENCES "AccessRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed protected system roles.
INSERT INTO "AccessRole" (
  "id",
  "key",
  "name",
  "normalizedName",
  "description",
  "status",
  "baseRole",
  "systemRole",
  "defaultModule",
  "protected",
  "updatedAt"
) VALUES
  ('role-super-admin', 'SUPER_ADMIN', 'Super Admin', 'super admin', 'Full platform access with protected system permissions.', 'ACTIVE', 'SUPER_ADMIN', 'SUPER_ADMIN', 'OVERVIEW', true, CURRENT_TIMESTAMP),
  ('role-branch-admin', 'BRANCH_ADMIN', 'Branch Manager', 'branch manager', 'Manage assigned branches, approvals, staff, members, and branch reports.', 'ACTIVE', 'BRANCH_ADMIN', 'BRANCH_ADMIN', 'APPROVALS', true, CURRENT_TIMESTAMP),
  ('role-cashier', 'CASHIER', 'Cashier', 'cashier', 'Scan customer QR codes and process loyalty activity at assigned branches.', 'ACTIVE', 'CASHIER', 'CASHIER', 'SCAN', true, CURRENT_TIMESTAMP);

INSERT INTO "RolePermission" ("id", "roleId", "module", "createdAt") VALUES
  ('perm-super-admin-overview', 'role-super-admin', 'OVERVIEW', CURRENT_TIMESTAMP),
  ('perm-super-admin-members', 'role-super-admin', 'MEMBERS', CURRENT_TIMESTAMP),
  ('perm-super-admin-approvals', 'role-super-admin', 'APPROVALS', CURRENT_TIMESTAMP),
  ('perm-super-admin-staff', 'role-super-admin', 'STAFF', CURRENT_TIMESTAMP),
  ('perm-super-admin-branches', 'role-super-admin', 'BRANCHES', CURRENT_TIMESTAMP),
  ('perm-super-admin-reports', 'role-super-admin', 'REPORTS', CURRENT_TIMESTAMP),
  ('perm-super-admin-system-reports', 'role-super-admin', 'SYSTEM_REPORTS', CURRENT_TIMESTAMP),
  ('perm-super-admin-settings', 'role-super-admin', 'SETTINGS', CURRENT_TIMESTAMP),
  ('perm-super-admin-scan', 'role-super-admin', 'SCAN', CURRENT_TIMESTAMP),
  ('perm-super-admin-roles-permissions', 'role-super-admin', 'ROLES_PERMISSIONS', CURRENT_TIMESTAMP),
  ('perm-branch-admin-overview', 'role-branch-admin', 'OVERVIEW', CURRENT_TIMESTAMP),
  ('perm-branch-admin-members', 'role-branch-admin', 'MEMBERS', CURRENT_TIMESTAMP),
  ('perm-branch-admin-approvals', 'role-branch-admin', 'APPROVALS', CURRENT_TIMESTAMP),
  ('perm-branch-admin-staff', 'role-branch-admin', 'STAFF', CURRENT_TIMESTAMP),
  ('perm-branch-admin-branches', 'role-branch-admin', 'BRANCHES', CURRENT_TIMESTAMP),
  ('perm-branch-admin-reports', 'role-branch-admin', 'REPORTS', CURRENT_TIMESTAMP),
  ('perm-cashier-scan', 'role-cashier', 'SCAN', CURRENT_TIMESTAMP);

UPDATE "StaffAssignment"
SET "roleId" = CASE
  WHEN "role" = 'BRANCH_ADMIN' THEN 'role-branch-admin'
  WHEN "role" = 'CASHIER' THEN 'role-cashier'
  WHEN "role" = 'SUPER_ADMIN' THEN 'role-super-admin'
  ELSE NULL
END
WHERE "role" IN ('BRANCH_ADMIN', 'CASHIER', 'SUPER_ADMIN');
