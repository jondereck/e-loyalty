import { redirect } from "next/navigation";
import { canLinkProfileByEmail, isProfileComplete } from "@/lib/auth/profile-resolution";
import { auth } from "@/lib/auth/server";
import { rolePriority, roleRedirects } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { canAccessModule, defaultLandingForProfile, type RoleModuleKey } from "@/lib/rbac";
import { canAccessDuringMaintenance, getMaintenanceSettings } from "@/lib/services/settings";

export { canLinkProfileByEmail, isProfileComplete };

export function highestRole(roles: string[] = []) {
  return rolePriority.find((role) => roles.includes(role)) ?? "CUSTOMER";
}

export function redirectForRoles(roles: string[] = []) {
  return roleRedirects[highestRole(roles)];
}

export function redirectForProfile(profile: CurrentProfile) {
  return defaultLandingForProfile(profile);
}

type AuthRecord = Record<string, unknown>;

type AuthUser = {
  id: string;
  email?: string;
  name?: string;
  imageUrl?: string;
  emailVerified: boolean;
  trustedProvider: boolean;
};

const trustedEmailProviders = new Set(["google"]);

const currentProfileInclude = {
  loyaltyCard: true,
  staffAssignments: {
    include: {
      branch: true,
      roleDefinition: {
        include: { permissions: true },
      },
    },
  },
} as const;

function asRecord(value: unknown): AuthRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as AuthRecord : null;
}

function asRecordArray(value: unknown): AuthRecord[] {
  return Array.isArray(value) ? value.map(asRecord).filter((item): item is AuthRecord => Boolean(item)) : [];
}

function stringValue(record: AuthRecord | null, key: string) {
  const value = record?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function booleanValue(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return undefined;
}

function hasVerifiedEmail(record: AuthRecord | null) {
  return [
    record?.emailVerified,
    record?.email_verified,
    record?.verifiedEmail,
    record?.verified,
  ].some((value) => booleanValue(value) === true);
}

function hasTrustedProvider(records: AuthRecord[]) {
  return records.some((record) => {
    const provider = stringValue(record, "provider") ?? stringValue(record, "providerId") ?? stringValue(record, "provider_id");
    return provider ? trustedEmailProviders.has(provider.toLowerCase()) : false;
  });
}

function normalizeSessionUser(sessionData: unknown): AuthUser | null {
  const root = asRecord(sessionData);
  const session = asRecord(root?.session);
  const user = asRecord(root?.user) ?? asRecord(session?.user);
  const id = stringValue(user, "id");
  if (!id) return null;

  const records = [
    root,
    session,
    user,
    asRecord(root?.account),
    asRecord(session?.account),
    ...asRecordArray(root?.accounts),
    ...asRecordArray(session?.accounts),
  ].filter((record): record is AuthRecord => Boolean(record));

  const email = stringValue(user, "email")?.toLowerCase();
  const imageUrl = [stringValue(user, "image"), stringValue(user, "picture"), stringValue(user, "avatar_url")].find(Boolean);

  return {
    id,
    email,
    name: stringValue(user, "name"),
    imageUrl,
    emailVerified: records.some(hasVerifiedEmail),
    trustedProvider: hasTrustedProvider(records),
  };
}

export async function getAuthUser() {
  try {
    const sessionResponse = await auth.getSession();
    return normalizeSessionUser(sessionResponse?.data);
  } catch (error) {
    console.error("Auth session retrieval failed:", error);
    return null;
  }
}

export async function getCurrentProfile() {
  const user = await getAuthUser();
  if (!user?.id) return null;

  try {
    const profileByAuthId = await prisma.userProfile.findUnique({
      where: { authUserId: user.id },
      include: currentProfileInclude,
    });
    if (profileByAuthId) return { ...profileByAuthId, avatarUrl: user.imageUrl ?? null };

    if (!canLinkProfileByEmail(user)) return null;

    const profileByEmail = await prisma.userProfile.findFirst({
      where: { email: { equals: user.email, mode: "insensitive" } },
      include: currentProfileInclude,
    });
    if (!profileByEmail) return null;

    const linkedProfile = profileByEmail.authUserId === user.id
      ? profileByEmail
      : await prisma.userProfile.update({
          where: { id: profileByEmail.id },
          data: { authUserId: user.id },
          include: currentProfileInclude,
        });

    return { ...linkedProfile, avatarUrl: user.imageUrl ?? null };
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

