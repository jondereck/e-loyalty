import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function normalizePostgresConnectionString(value: string) {
  try {
    const url = new URL(value);
    if (url.searchParams.get("sslmode") === "require") {
      url.searchParams.set("sslmode", "verify-full");
      return url.toString();
    }
  } catch {
    return value;
  }

  return value;
}

const rawConnectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/e_loyalty";
const connectionString = normalizePostgresConnectionString(rawConnectionString);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
