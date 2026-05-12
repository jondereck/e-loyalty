import type { AppRole } from "@/generated/prisma/client";

export const PUBLIC_DEFAULT_ROLE = "CUSTOMER" as const;

export function resolvePublicProfileRoles(existingRoles?: AppRole[] | null): AppRole[] {
  return existingRoles?.length ? existingRoles : [PUBLIC_DEFAULT_ROLE];
}
