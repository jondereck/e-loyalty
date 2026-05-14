import { createHmac, timingSafeEqual } from "crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { UserProfile } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const PENDING_CONNECT_COOKIE = "lp-pending-account-connect";
export const PENDING_CONNECT_TTL_SECONDS = 10 * 60;

type PendingConnectPayload = {
  ownerProfileId: string;
  expiresAt: number;
};

export type ConnectedAccountItem = {
  id: string;
  name: string;
  email: string;
  roleLabel: string;
  avatarUrl: string | null;
};

export async function getConnectedAccounts(profileId?: string | null): Promise<ConnectedAccountItem[]> {
  if (!profileId) return [];

  const connections = await prisma.accountConnection.findMany({
    where: {
      ownerProfileId: profileId,
      connectedProfile: { status: "ACTIVE" },
    },
    include: {
      connectedProfile: true,
    },
    orderBy: {
      connectedProfile: { fullName: "asc" },
    },
  });

  return connections.map(({ connectedProfile }) => ({
    id: connectedProfile.id,
    name: connectedProfile.fullName,
    email: connectedProfile.email,
    roleLabel: profileRoleLabel(connectedProfile.roles),
    avatarUrl: null,
  }));
}

export async function getConnectedAccountForSwitch(ownerProfileId: string, connectedProfileId: string) {
  const connection = await prisma.accountConnection.findUnique({
    where: {
      ownerProfileId_connectedProfileId: {
        ownerProfileId,
        connectedProfileId,
      },
    },
    include: {
      connectedProfile: {
        select: {
          id: true,
          email: true,
          status: true,
        },
      },
    },
  });

  if (!connection || connection.connectedProfile.status !== "ACTIVE") return null;
  return connection.connectedProfile;
}

export async function setPendingAccountConnect(ownerProfileId: string) {
  const cookieStore = await cookies();
  cookieStore.set(PENDING_CONNECT_COOKIE, createPendingAccountConnectToken(ownerProfileId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: PENDING_CONNECT_TTL_SECONDS,
  });
}

export function createPendingAccountConnectToken(ownerProfileId: string) {
  return signPayload({
    ownerProfileId,
    expiresAt: Date.now() + PENDING_CONNECT_TTL_SECONDS * 1000,
  });
}

export async function consumePendingAccountConnect({ clearCookie = false }: { clearCookie?: boolean } = {}) {
  const cookieStore = await cookies();
  const value = cookieStore.get(PENDING_CONNECT_COOKIE)?.value;
  if (clearCookie) {
    cookieStore.delete(PENDING_CONNECT_COOKIE);
  }
  if (!value) return null;

  const payload = verifyPayload(value);
  if (!payload || payload.expiresAt < Date.now()) return null;
  return payload;
}

export async function completePendingAccountConnect(
  currentProfile: Pick<UserProfile, "id" | "status">,
  options: { clearCookie?: boolean } = {},
) {
  const pending = await consumePendingAccountConnect(options);
  if (!pending || pending.ownerProfileId === currentProfile.id || currentProfile.status !== "ACTIVE") {
    return false;
  }

  const owner = await prisma.userProfile.findUnique({
    where: { id: pending.ownerProfileId },
    select: { id: true, status: true },
  });
  if (!owner || owner.status !== "ACTIVE") return false;

  const created = await prisma.$transaction(async (tx) => {
    const result = await tx.accountConnection.createMany({
      data: [
        { ownerProfileId: owner.id, connectedProfileId: currentProfile.id },
        { ownerProfileId: currentProfile.id, connectedProfileId: owner.id },
      ],
      skipDuplicates: true,
    });

    if (result.count > 0) {
      await tx.auditEvent.createMany({
        data: [
          {
            actorId: owner.id,
            action: "ACCOUNT_CONNECTED",
            metadata: { connectedProfileId: currentProfile.id },
          },
          {
            actorId: currentProfile.id,
            action: "ACCOUNT_CONNECTED",
            metadata: { connectedProfileId: owner.id },
          },
        ],
      });
    }

    return result.count > 0;
  });

  if (created) {
    revalidatePath("/admin/dashboard");
    revalidatePath("/super-admin/settings");
  }

  return created;
}

function signPayload(payload: PendingConnectPayload) {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${signature(body)}`;
}

function verifyPayload(value: string): PendingConnectPayload | null {
  const [body, receivedSignature] = value.split(".");
  if (!body || !receivedSignature) return null;

  const expectedSignature = signature(body);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Partial<PendingConnectPayload>;
    if (typeof parsed.ownerProfileId !== "string" || typeof parsed.expiresAt !== "number") return null;
    return { ownerProfileId: parsed.ownerProfileId, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

function signature(body: string) {
  return createHmac("sha256", accountConnectionSecret()).update(body).digest("base64url");
}

function accountConnectionSecret() {
  return process.env.ACCOUNT_CONNECTION_SECRET || process.env.NEON_AUTH_COOKIE_SECRET || "development-only-account-connection-secret";
}

function profileRoleLabel(roles: UserProfile["roles"]) {
  if (roles.includes("SUPER_ADMIN")) return "Super Admin";
  if (roles.includes("BRANCH_ADMIN")) return "Branch Manager";
  if (roles.includes("CASHIER")) return "Staff";
  return "Customer";
}
