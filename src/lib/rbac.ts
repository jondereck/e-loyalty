import type { AppRole } from "@/generated/prisma/client";

export const roleModuleKeys = [
  "OVERVIEW",
  "MEMBERS",
  "APPROVALS",
  "STAFF",
  "BRANCHES",
  "REPORTS",
  "SYSTEM_REPORTS",
  "SETTINGS",
  "SCAN",
  "ROLES_PERMISSIONS",
] as const;

export type RoleModuleKey = (typeof roleModuleKeys)[number];

export type RoleModuleDefinition = {
  key: RoleModuleKey;
  label: string;
  description: string;
  category: "Dashboard" | "People Management" | "Branch Management" | "Transactions / Scanning" | "Reports" | "Settings";
  href: string;
  superAdminOnly?: boolean;
};

export const roleModules: RoleModuleDefinition[] = [
  { key: "OVERVIEW", label: "Overview", description: "Main admin dashboard and branch performance summary.", category: "Dashboard", href: "/admin/dashboard" },
  { key: "MEMBERS", label: "Members", description: "Member list, profiles, and loyalty account management.", category: "People Management", href: "/admin/members" },
  { key: "APPROVALS", label: "Approvals", description: "Review pending scans and approval history.", category: "People Management", href: "/admin/approvals" },
  { key: "STAFF", label: "Staff", description: "Create and manage staff accounts and assignments.", category: "People Management", href: "/admin/staff" },
  { key: "BRANCHES", label: "Branches", description: "Branch list, details, and branch setup.", category: "Branch Management", href: "/admin/branches" },
  { key: "SCAN", label: "Scan", description: "Cashier QR scanning and scan result pages.", category: "Transactions / Scanning", href: "/cashier/scan" },
  { key: "REPORTS", label: "Reports", description: "Branch-scoped reports and exports.", category: "Reports", href: "/admin/reports" },
  { key: "SYSTEM_REPORTS", label: "System Reports", description: "System-wide analytics and platform reports.", category: "Reports", href: "/super-admin/reports", superAdminOnly: true },
  { key: "SETTINGS", label: "Settings", description: "System settings excluding role management.", category: "Settings", href: "/super-admin/settings", superAdminOnly: true },
  { key: "ROLES_PERMISSIONS", label: "Roles & Permissions", description: "Custom role and module access management.", category: "Settings", href: "/super-admin/settings?tab=roles", superAdminOnly: true },
];

export const protectedModuleKeys: RoleModuleKey[] = ["SETTINGS", "APPROVALS"];

export const allModuleKeys = roleModules.map((module) => module.key);

export const defaultRoleConfigs = [
  {
    key: "SUPER_ADMIN",
    name: "Super Admin",
    normalizedName: "super admin",
    description: "Full platform access with protected system permissions.",
    baseRole: "SUPER_ADMIN" as AppRole,
    systemRole: "SUPER_ADMIN" as AppRole,
    defaultModule: "OVERVIEW" as RoleModuleKey,
    modules: allModuleKeys,
    protected: true,
  },
  {
    key: "BRANCH_ADMIN",
    name: "Branch Manager",
    normalizedName: "branch manager",
    description: "Manage assigned branches, approvals, staff, members, and branch reports.",
    baseRole: "BRANCH_ADMIN" as AppRole,
    systemRole: "BRANCH_ADMIN" as AppRole,
    defaultModule: "APPROVALS" as RoleModuleKey,
    modules: ["OVERVIEW", "MEMBERS", "APPROVALS", "STAFF", "BRANCHES", "REPORTS"] as RoleModuleKey[],
    protected: false,
  },
  {
    key: "CASHIER",
    name: "Cashier",
    normalizedName: "cashier",
    description: "Scan customer QR codes and process loyalty activity at assigned branches.",
    baseRole: "CASHIER" as AppRole,
    systemRole: "CASHIER" as AppRole,
    defaultModule: "SCAN" as RoleModuleKey,
    modules: ["SCAN"] as RoleModuleKey[],
    protected: false,
  },
] as const;

export type RoleAccessAssignment = {
  status: string;
  role: AppRole | string;
  roleDefinition?: {
    status: string;
    defaultModule: RoleModuleKey | string;
    permissions: Array<{ module: RoleModuleKey | string }>;
  } | null;
};

export type RoleAccessProfile = {
  roles: Array<AppRole | string>;
  staffAssignments: RoleAccessAssignment[];
};

export function normalizeRoleName(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function isRoleModuleKey(value: string): value is RoleModuleKey {
  return roleModuleKeys.includes(value as RoleModuleKey);
}

export function isProtectedSystemRoleKey(value?: string | null) {
  return value === "SUPER_ADMIN" || value === "BRANCH_ADMIN" || value === "CASHIER";
}

export function modulesForSystemRole(role: AppRole | string): RoleModuleKey[] {
  return defaultRoleConfigs.find((config) => config.systemRole === role)?.modules.slice() ?? [];
}

export function moduleHref(module: RoleModuleKey) {
  return roleModules.find((item) => item.key === module)?.href ?? "/admin/dashboard";
}

export function firstEnabledModule(modules: Iterable<RoleModuleKey>) {
  const set = new Set(modules);
  return roleModuleKeys.find((module) => set.has(module)) ?? null;
}

export function moduleForPath(path: string): RoleModuleKey | null {
  const pathname = path.split("?")[0] ?? path;
  if (pathname === "/admin/dashboard" || pathname === "/admin") return "OVERVIEW";
  if (pathname.startsWith("/admin/members")) return "MEMBERS";
  if (pathname.startsWith("/admin/approvals")) return "APPROVALS";
  if (pathname.startsWith("/admin/staff")) return "STAFF";
  if (pathname.startsWith("/admin/branches")) return "BRANCHES";
  if (pathname.startsWith("/admin/reports")) return "REPORTS";
  if (pathname.startsWith("/super-admin/reports")) return "SYSTEM_REPORTS";
  if (pathname.startsWith("/super-admin/settings")) return "SETTINGS";
  if (pathname.startsWith("/cashier/scan")) return "SCAN";
  return null;
}

export function baseRoleForModules(modules: RoleModuleKey[]) {
  return modules.some((module) => module !== "SCAN") ? "BRANCH_ADMIN" as AppRole : "CASHIER" as AppRole;
}

export function resolveProfileModules(profile: RoleAccessProfile | null | undefined): Set<RoleModuleKey> {
  const modules = new Set<RoleModuleKey>();
  if (!profile) return modules;
  const isSuperAdmin = profile.roles.includes("SUPER_ADMIN");
  if (isSuperAdmin) {
    allModuleKeys.forEach((module) => modules.add(module));
    return modules;
  }

  for (const assignment of profile.staffAssignments) {
    if (assignment.status !== "ACTIVE") continue;
    const definition = assignment.roleDefinition;
    if (definition && definition.status !== "ACTIVE") continue;
    const assignedModules = definition
      ? definition.permissions.map((permission) => permission.module).filter((module): module is RoleModuleKey => isRoleModuleKey(String(module)))
      : modulesForSystemRole(assignment.role);
    assignedModules
      .filter((module) => isSuperAdmin || !roleModules.find((definition) => definition.key === module)?.superAdminOnly)
      .forEach((module) => modules.add(module));
  }

  return modules;
}

export function canAccessModule(profile: RoleAccessProfile | null | undefined, module: RoleModuleKey) {
  return resolveProfileModules(profile).has(module);
}

export function defaultLandingForProfile(profile: RoleAccessProfile | null | undefined) {
  if (!profile) return "/login";
  if (profile.roles.includes("SUPER_ADMIN")) return "/admin/dashboard";

  const enabledModules = resolveProfileModules(profile);
  for (const assignment of profile.staffAssignments) {
    if (assignment.status !== "ACTIVE") continue;
    const preferred = assignment.roleDefinition?.defaultModule;
    if (preferred && isRoleModuleKey(String(preferred)) && enabledModules.has(preferred as RoleModuleKey)) {
      return moduleHref(preferred as RoleModuleKey);
    }
  }

  const first = firstEnabledModule(enabledModules);
  if (first) return moduleHref(first);
  if (profile.roles.includes("CUSTOMER")) return "/card";
  return "/login";
}

export function coerceEnabledDefaultModule(modules: RoleModuleKey[], requested: RoleModuleKey) {
  return modules.includes(requested) ? requested : modules[0] ?? "SCAN";
}
