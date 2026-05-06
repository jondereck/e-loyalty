import { prisma } from "@/lib/prisma";
import { getCurrentProfile } from "@/lib/services/session";

export async function redeemReward(milestoneId: string, qrToken?: string) {
  const cashier = await getCurrentProfile();
  if (!cashier) throw new Error("Not authenticated.");
  if (!cashier.roles.some((role) => ["CASHIER", "BRANCH_ADMIN", "SUPER_ADMIN"].includes(role))) {
    throw new Error("Only staff can redeem rewards.");
  }

  const assignment = cashier.staffAssignments.find((item) => item.status === "ACTIVE");
  const [milestone, card] = await Promise.all([
    prisma.rewardMilestone.findUniqueOrThrow({ where: { id: milestoneId } }),
    qrToken
      ? prisma.loyaltyCard.findUnique({ where: { qrToken }, include: { profile: true } })
      : Promise.resolve(null),
  ]);

  if (!card) throw new Error("Customer QR was not found.");
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

    return redemption;
  });
}
