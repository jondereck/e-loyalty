import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { rolePriority, roleRedirects } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export function highestRole(roles: string[] = []) {
  return rolePriority.find((role) => roles.includes(role)) ?? "CUSTOMER";
}

export function redirectForRoles(roles: string[] = []) {
  return roleRedirects[highestRole(roles)];
}

export async function getAuthUser() {
  const { data } = await auth.getSession();
  const session = data as unknown as {
    user?: { id?: string; email?: string; name?: string };
    session?: { user?: { id?: string; email?: string; name?: string } };
  } | null;
  const user = session?.user ?? session?.session?.user;
  if (!user?.id) return null;
  return user;
}

export async function getCurrentProfile() {
  const user = await getAuthUser();
  if (!user?.id) return null;

  return prisma.userProfile.findUnique({
    where: { authUserId: user.id },
    include: {
      loyaltyCard: true,
      staffAssignments: {
        include: { branch: true },
      },
    },
  });
}

export async function requireProfile(allowedRoles?: string[]) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.status !== "ACTIVE") redirect("/login?error=suspended");

  if (allowedRoles?.length) {
    const allowed = profile.roles.some((role) => allowedRoles.includes(role));
    if (!allowed) redirect(redirectForRoles(profile.roles));
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

