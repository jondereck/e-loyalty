import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/e_loyalty",
  }),
});

function csv(name: string) {
  return (process.env[name] ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

async function main() {
  const branch = await prisma.branch.upsert({
    where: { code: process.env.SEED_BRANCH_CODE ?? "MAIN" },
    update: {
      name: process.env.SEED_BRANCH_NAME ?? "Main Branch",
      address: process.env.SEED_BRANCH_ADDRESS || undefined,
      phone: process.env.SEED_BRANCH_PHONE || undefined,
      email: process.env.SEED_BRANCH_EMAIL || undefined,
      status: "ACTIVE",
    },
    create: {
      code: process.env.SEED_BRANCH_CODE ?? "MAIN",
      name: process.env.SEED_BRANCH_NAME ?? "Main Branch",
      address: process.env.SEED_BRANCH_ADDRESS || undefined,
      phone: process.env.SEED_BRANCH_PHONE || undefined,
      email: process.env.SEED_BRANCH_EMAIL || undefined,
      status: "ACTIVE",
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: "business_timezone" },
    update: { value: "Asia/Manila" },
    create: { key: "business_timezone", value: "Asia/Manila" },
  });

  await prisma.systemSetting.upsert({
    where: { key: "points_per_visit" },
    update: { value: 100 },
    create: { key: "points_per_visit", value: 100 },
  });

  const rewards = [
    ["Free Drink", "A complimentary regular drink.", 1000, 0],
    ["Premium Upgrade", "Upgrade one purchase to premium.", 2500, 500],
    ["VIP Bundle", "Redeem a high-value loyalty bundle.", 5000, 1000],
  ] as const;

  for (const [name, description, pointsRequired, pointsCost] of rewards) {
    await prisma.rewardMilestone.upsert({
      where: { name },
      update: { description, pointsRequired, pointsCost, status: "AVAILABLE" },
      create: { name, description, pointsRequired, pointsCost, status: "AVAILABLE" },
    });
  }

  await assignRoles(csv("SEED_SUPER_ADMIN_EMAILS"), ["SUPER_ADMIN"]);
  await assignRoles(csv("SEED_BRANCH_ADMIN_EMAILS"), ["BRANCH_ADMIN"], branch.id);
  await assignRoles(csv("SEED_CASHIER_EMAILS"), ["CASHIER"], branch.id);
}

async function assignRoles(emails: string[], roles: Array<"SUPER_ADMIN" | "BRANCH_ADMIN" | "CASHIER">, branchId?: string) {
  for (const email of emails) {
    const profile = await prisma.userProfile.findUnique({ where: { email } });
    if (!profile) {
      console.warn(`Seed role skipped; no profile exists for ${email}. Sign up first, then rerun seed.`);
      continue;
    }

    await prisma.userProfile.update({
      where: { id: profile.id },
      data: { roles: Array.from(new Set([...profile.roles, ...roles, "CUSTOMER"])) },
    });

    if (branchId) {
      for (const role of roles) {
        await prisma.staffAssignment.upsert({
          where: { profileId_branchId_role: { profileId: profile.id, branchId, role } },
          update: { status: "ACTIVE" },
          create: { profileId: profile.id, branchId, role, status: "ACTIVE" },
        });
      }
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
