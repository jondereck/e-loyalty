import { prisma } from "@/lib/prisma";
import { getBusinessTimezone } from "@/lib/services/settings";
import { businessDayWindow } from "@/lib/time";

export async function getCustomerCard(profileId: string) {
  const now = new Date();
  const businessTimezone = await getBusinessTimezone();
  const { start, end, nextEligibleAt } = businessDayWindow(now, businessTimezone);
  const profile = await prisma.userProfile.findUniqueOrThrow({
    where: { id: profileId },
    include: {
      loyaltyCard: true,
    },
  });

  if (!profile.loyaltyCard) throw new Error("No loyalty card found.");

  const lastVisit = await prisma.visit.findFirst({
    where: {
      loyaltyCardId: profile.loyaltyCard.id,
      status: { in: ["AUTO_APPROVED", "APPROVED"] },
    },
    include: { branch: true },
    orderBy: { scannedAt: "desc" },
  });

  const todayVisit = await prisma.visit.findFirst({
    where: {
      loyaltyCardId: profile.loyaltyCard.id,
      status: { in: ["AUTO_APPROVED", "APPROVED"] },
      scannedAt: { gte: start, lt: end },
    },
  });

  const nextReward = await prisma.rewardMilestone.findFirst({
    where: {
      status: { not: "DISABLED" },
      pointsRequired: { gt: profile.loyaltyCard.pointsBalance },
    },
    orderBy: { pointsRequired: "asc" },
  });

  return {
    profile,
    card: profile.loyaltyCard,
    lastVisit,
    todayEligibility: todayVisit ? "Already used today" : "Eligible today",
    nextEligibleAt: todayVisit ? nextEligibleAt : null,
    nextReward,
  };
}

export async function getCustomerHistory(profileId: string) {
  const card = await prisma.loyaltyCard.findUniqueOrThrow({ where: { profileId } });
  const [visits, ledger, redemptions] = await Promise.all([
    prisma.visit.findMany({
      where: { loyaltyCardId: card.id },
      include: { branch: true },
      orderBy: { scannedAt: "desc" },
      take: 50,
    }),
    prisma.pointLedger.findMany({
      where: { loyaltyCardId: card.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.rewardRedemption.findMany({
      where: { loyaltyCardId: card.id },
      include: { milestone: true, branch: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  return { card, visits, ledger, redemptions };
}

export async function getCustomerRewards(profileId: string) {
  const card = await prisma.loyaltyCard.findUniqueOrThrow({ where: { profileId } });
  const [milestones, redemptions] = await Promise.all([
    prisma.rewardMilestone.findMany({
      where: { status: { not: "DISABLED" } },
      orderBy: { pointsRequired: "asc" },
    }),
    prisma.rewardRedemption.findMany({
      where: { loyaltyCardId: card.id },
      select: { milestoneId: true },
    }),
  ]);
  const redeemed = new Set(redemptions.map((item) => item.milestoneId));

  return {
    card,
    rewards: milestones.map((milestone) => ({
      ...milestone,
      computedStatus: redeemed.has(milestone.id)
        ? "REDEEMED"
        : card.pointsBalance >= milestone.pointsRequired
          ? "AVAILABLE"
          : "LOCKED",
    })),
  };
}
