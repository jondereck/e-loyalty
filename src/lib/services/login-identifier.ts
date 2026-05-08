import "server-only";

import { prisma } from "@/lib/prisma";

export async function resolveLoginIdentifier(identifier: string) {
  const normalized = identifier.trim().toLowerCase();
  const raw = identifier.trim();
  const profile = await prisma.userProfile.findFirst({
    where: {
      OR: [{ email: normalized }, { username: normalized }, { mobile: raw }],
    },
  });

  return {
    profile,
    email: profile?.email ?? (normalized.includes("@") ? normalized : null),
  };
}
