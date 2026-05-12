import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { rolePriority, roleRedirects } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { canAccessModule, defaultLandingForProfile, type RoleModuleKey } from "@/lib/rbac";
import { canAccessDuringMaintenance, getMaintenanceSettings } from "@/lib/services/settings";

export function highestRole(roles: string[] = []) {
  return rolePriority.find((role) => roles.includes(role)) ?? "CUSTOMER";
}

export function redirectForRoles(roles: string[] = []) {
  return roleRedirects[highestRole(roles)];
}

export function redirectForProfile(profile: CurrentProfile) {
  return defaultLandingForProfile(profile);
}

export async function getAuthUser() {
  try {
    const sessionResponse = await auth.getSession();
    const data = sessionResponse?.data;
    if (!data) return null;

    const session = data as unknown as {
      user?: { id?: string; email?: string; name?: string; image?: string; picture?: string; avatar_url?: string };
      session?: { user?: { id?: string; email?: string; name?: string; image?: string; picture?: string; avatar_url?: string } };
    } | null;

    const user = session?.user ?? session?.session?.user;
    if (!user?.id) return null;
    const imageUrl = [user.image, user.picture, user.avatar_url].find((value) => typeof value === "string" && value.trim());
    return {
      id: String(user.id),
      email: typeof user.email === "string" ? user.email : undefined,
      name: typeof user.name === "string" ? user.name : undefined,
      imageUrl: typeof imageUrl === "string" ? imageUrl : undefined,
    };
  } catch (error) {
    console.error("Auth session retrieval failed:", error);
    return null;
  }
}

export async function getCurrentProfile() {
  const user = await getAuthUser();
  if (!user?.id) return null;

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { authUserId: String(user.id) },
      include: {
        loyaltyCard: true,
        staffAssignments: {
          include: {
            branch: true,
            roleDefinition: {
              include: { permissions: true },
            },
          },
        },
      },
    });
    if (!profile) return null;
    return { ...profile, avatarUrl: user.imageUrl ?? null };
  } catch (error) {
    console.error("Error fetching profile from database:", error);
    return null;
  }
}

export type CurrentProfile = NonNullable<Awaited<ReturnType<typeof getCurrentProfile>>>;

export function activeAssignmentsForRole(profile: CurrentProfile, roles: string[]) {
  return profile.staffAssignments.filter(
    (assignment) =>
      assignment.status === "ACTIVE" &&
      assignment.branch.status === "ACTIVE" &&
      roles.includes(assignment.role),
  );
}

export function branchIdsForAdmin(profile: CurrentProfile) {
  if (profile.roles.includes("SUPER_ADMIN")) return undefined;
  return activeAssignmentsForRole(profile, ["BRANCH_ADMIN"]).map((assignment) => assignment.branchId);
}

export function getStaffScope(profile: CurrentProfile, roles: string[], branchId?: string) {
  if (profile.roles.includes("SUPER_ADMIN")) {
    return {
      isSuperAdmin: true,
      branchIds: undefined as string[] | undefined,
      branchId,
    };
  }

  const assignments = activeAssignmentsForRole(profile, roles);
  const scopedAssignments = branchId
    ? assignments.filter((assignment) => assignment.branchId === branchId)
    : assignments;

  return {
    isSuperAdmin: false,
    branchIds: assignments.map((assignment) => assignment.branchId),
    branchId: branchId ?? assignments[0]?.branchId,
    assignment: scopedAssignments[0],
  };
}

export async function requireProfile(allowedRoles?: readonly string[]) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.status !== "ACTIVE") redirect("/login?error=suspended");
  if (profile.mustChangePassword) redirect("/auth/force-password");

  if (allowedRoles?.length) {
    const allowed = profile.roles.some((role) => allowedRoles.includes(role));
    if (!allowed) redirect(redirectForProfile(profile));
  }

  const maintenance = await getMaintenanceSettings();
  if (!canAccessDuringMaintenance({ path: "", roles: profile.roles, maintenanceEnabled: maintenance.maintenanceEnabled })) {
    redirect("/maintenance");
  }

  return profile;
}

export async function requireBranchScopedProfile(branchId?: string) {
  const profile = await requireProfile(["BRANCH_ADMIN", "SUPER_ADMIN"]);
  if (profile.roles.includes("SUPER_ADMIN")) return profile;
  if (!branchId) return profile;

  const assigned = profile.staffAssignments.some(
    (assignment) =>
      assignment.branchId === branchId &&
      assignment.status === "ACTIVE" &&
      assignment.role === "BRANCH_ADMIN",
  );

  if (!assigned) redirect("/admin/approvals");
  return profile;
}

export async function requireModuleAccess(module: RoleModuleKey) {
  const profile = await requireProfile();
  if (!canAccessModule(profile, module)) {
    redirect(redirectForProfile(profile));
  }
  return profile;
}

export async function requirePasswordResetProfile() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.status !== "ACTIVE") redirect("/login?error=suspended");
  if (!profile.mustChangePassword) redirect(redirectForProfile(profile));
  return profile;
}

