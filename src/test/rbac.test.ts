import { describe, expect, it } from "vitest";
import {
  allModuleKeys,
  canAccessModule,
  coerceEnabledDefaultModule,
  defaultLandingForProfile,
  defaultRoleConfigs,
  normalizeRoleName,
  resolveProfileModules,
} from "@/lib/rbac";
import { createRoleSchema } from "@/lib/validations/roles";

describe("role validation", () => {
  it("requires enabled modules and default landing inside the enabled set", () => {
    expect(() =>
      createRoleSchema.parse({
        name: "Scanner",
        description: "Can scan customer QR codes.",
        status: "ACTIVE",
        defaultModule: "OVERVIEW",
        modules: ["SCAN"],
      }),
    ).toThrow("Default landing page must be an enabled module.");

    expect(
      createRoleSchema.parse({
        name: "Scanner",
        description: "Can scan customer QR codes.",
        status: "ACTIVE",
        defaultModule: "SCAN",
        modules: ["SCAN"],
      }),
    ).toMatchObject({ defaultModule: "SCAN", modules: ["SCAN"] });
  });

  it("normalizes duplicate role names consistently", () => {
    expect(normalizeRoleName("  Branch   Manager ")).toBe("branch manager");
    expect(normalizeRoleName("branch manager")).toBe("branch manager");
  });

  it("keeps Super Admin protected with all modules", () => {
    const superAdmin = defaultRoleConfigs.find((role) => role.key === "SUPER_ADMIN");
    expect(superAdmin?.protected).toBe(true);
    expect(superAdmin?.modules).toEqual(allModuleKeys);
  });

  it("keeps Branch Manager and Cashier editable by default", () => {
    expect(defaultRoleConfigs.find((role) => role.key === "BRANCH_ADMIN")?.protected).toBe(false);
    expect(defaultRoleConfigs.find((role) => role.key === "CASHIER")?.protected).toBe(false);
  });
});

describe("permission resolution", () => {
  it("always grants Super Admin all modules", () => {
    const modules = resolveProfileModules({ roles: ["SUPER_ADMIN"], staffAssignments: [] });
    expect(modules.size).toBe(allModuleKeys.length);
    expect(modules.has("ROLES_PERMISSIONS")).toBe(true);
  });

  it("grants active custom role modules only", () => {
    const profile = {
      roles: ["BRANCH_ADMIN"],
      staffAssignments: [
        {
          status: "ACTIVE",
          role: "BRANCH_ADMIN",
          roleDefinition: {
            status: "ACTIVE",
            defaultModule: "APPROVALS",
            permissions: [{ module: "APPROVALS" }, { module: "MEMBERS" }],
          },
        },
      ],
    };

    expect(canAccessModule(profile, "APPROVALS")).toBe(true);
    expect(canAccessModule(profile, "BRANCHES")).toBe(false);
  });

  it("ignores inactive roles and falls back to the first enabled landing page", () => {
    const profile = {
      roles: ["CASHIER"],
      staffAssignments: [
        {
          status: "ACTIVE",
          role: "CASHIER",
          roleDefinition: {
            status: "ACTIVE",
            defaultModule: "OVERVIEW",
            permissions: [{ module: "SCAN" }],
          },
        },
        {
          status: "ACTIVE",
          role: "BRANCH_ADMIN",
          roleDefinition: {
            status: "INACTIVE",
            defaultModule: "APPROVALS",
            permissions: [{ module: "APPROVALS" }],
          },
        },
      ],
    };

    expect(defaultLandingForProfile(profile)).toBe("/cashier/scan");
    expect(canAccessModule(profile, "APPROVALS")).toBe(false);
  });

  it("coerces default landing to an enabled module", () => {
    expect(coerceEnabledDefaultModule(["SCAN"], "OVERVIEW")).toBe("SCAN");
  });
});
