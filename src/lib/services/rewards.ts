import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { activeAssignmentsForRole, getCurrentProfile } from "@/lib/services/session";

export async function redeemReward(milestoneId: string, qrToken?: string) {
  const cashier = await getCurrentProfile();
  if (!cashier) throw new Error("Not authenticated.");
  if (cashier.status !== "ACTIVE") throw new Error("Inactive users cannot redeem rewards.");
  if (!cashier.roles.some((role) => ["CASHIER", "BRANCH_ADMIN", "SUPER_ADMIN"].includes(role))) {
    throw new Error("Only staff can redeem rewards.");
  }

  const assignment = activeAssignmentsForRole(cashier, ["CASHIER", "BRANCH_ADMIN"])[0];
  const [milestone, card] = await Promise.all([
    prisma.rewardMilestone.findUniqueOrThrow({ where: { id: milestoneId } }),
    qrToken
      ? prisma.loyaltyCard.findUnique({ where: { qrToken }, include: { profile: true } })
      : Promise.resolve(null),
  ]);

  if (!card) throw new Error("Customer QR was not found.");
  if (card.status !== "ACTIVE") throw new Error("This loyalty card cannot redeem right now.");
  if (card.profile.status !== "ACTIVE") throw new Error("Customer account is not active.");
  if (milestone.status !== "AVAILABLE") throw new Error("This reward is not available.");
  if (!cashier.roles.includes("SUPER_ADMIN") && !assignment) {
    throw new Error("Cashier is not assigned to an active branch.");
  }
  if (card.pointsBalance < milestone.pointsRequired) throw new Error("Customer is not eligible for this reward yet.");
  if (milestone.pointsCost > card.pointsBalance) throw new Error("Customer does not have enough points to redeem.");

  return prisma.$transaction(async (tx) => {
    const redemption = await tx.rewardRedemption.create({
      data: {
        milestoneId,
        profileId: card.profileId,
        loyaltyCardId: card.id,
        branchId: assignment?.branchId,
        cashierId: cashier.id,
        status: "REDEEMED",
      },
    });

    if (milestone.pointsCost > 0) {
      await tx.pointLedger.create({
        data: {
          loyaltyCardId: card.id,
          profileId: card.profileId,
          redemptionId: redemption.id,
          type: "REDEEM",
          points: -milestone.pointsCost,
          description: `Redeemed ${milestone.name}`,
        },
      });

      await tx.loyaltyCard.update({
        where: { id: card.id },
        data: {
          pointsBalance: { decrement: milestone.pointsCost },
          totalRedeemed: { increment: milestone.pointsCost },
        },
      });
    }

    await tx.auditEvent.create({
      data: {
        actorId: cashier.id,
        action: "REWARD_REDEEMED",
        metadata: {
          redemptionId: redemption.id,
          milestoneId,
          loyaltyCardId: card.id,
          branchId: assignment?.branchId,
          pointsCost: milestone.pointsCost,
        },
      },
    });

    return redemption;
  }).catch((error: unknown) => {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("This reward was already redeemed for this loyalty card.");
    }
    throw error;
  });
}
