import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const CONFIRM_FLAG = "--confirm-delete-all-accounts";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/e_loyalty",
  }),
});

async function main() {
  if (!process.argv.includes(CONFIRM_FLAG)) {
    console.error(`Refusing to delete accounts. Re-run with ${CONFIRM_FLAG}`);
    process.exitCode = 1;
    return;
  }

  const before = await counts();

  await prisma.$transaction([
    prisma.auditEvent.deleteMany(),
    prisma.pointLedger.deleteMany(),
    prisma.rewardRedemption.deleteMany(),
    prisma.scanAttempt.deleteMany(),
    prisma.visit.deleteMany(),
    prisma.loyaltyCard.deleteMany(),
    prisma.staffAssignment.deleteMany(),
    prisma.userProfile.deleteMany(),
  ]);

  const after = await counts();

  console.log("Account reset complete.");
  console.table({ before, after });
  console.log("Kept branches, reward milestones, and system settings.");
  console.log("Note: Neon Auth upstream users are not deleted by this database reset.");
}

async function counts() {
  const [
    users,
    staffAssignments,
    loyaltyCards,
    visits,
    pointLedger,
    redemptions,
    scanAttempts,
    auditEvents,
  ] = await Promise.all([
    prisma.userProfile.count(),
    prisma.staffAssignment.count(),
    prisma.loyaltyCard.count(),
    prisma.visit.count(),
    prisma.pointLedger.count(),
    prisma.rewardRedemption.count(),
    prisma.scanAttempt.count(),
    prisma.auditEvent.count(),
  ]);

  return {
    users,
    staffAssignments,
    loyaltyCards,
    visits,
    pointLedger,
    redemptions,
    scanAttempts,
    auditEvents,
  };
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
