import { prisma } from "@/lib/prisma";
import { getBusinessTimezone } from "@/lib/services/settings";
import { businessDayWindow } from "@/lib/time";

export async function getReportData({
  branchIds,
  dateFrom,
  dateTo,
}: {
  branchIds?: string[];
  dateFrom?: string;
  dateTo?: string;
}) {
  const businessTimezone = await getBusinessTimezone();

  let start: Date;
  let end: Date;

  if (dateFrom && dateTo) {
    start = new Date(`${dateFrom}T00:00:00+08:00`);
    end = new Date(`${dateTo}T23:59:59+08:00`);
  } else {
    const window = businessDayWindow(new Date(), businessTimezone);
    start = new Date(window.start);
    start.setDate(start.getDate() - 30);
    end = window.end;
  }

  const where = {
    scannedAt: { gte: start, lte: end },
    ...(branchIds ? { branchId: { in: branchIds } } : {}),
  };

  const [visits, redemptions, pointsEarned] = await Promise.all([
    prisma.visit.findMany({
      where,
      include: { branch: true, customer: true, cashier: true },
      orderBy: { scannedAt: "desc" },
    }),
    prisma.rewardRedemption.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        ...(branchIds ? { branchId: { in: branchIds } } : {}),
      },
      include: { branch: true, profile: true, milestone: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.pointLedger.aggregate({
      where: {
        createdAt: { gte: start, lte: end },
        type: "EARN",
        ...(branchIds ? { visit: { branchId: { in: branchIds } } } : {}),
      },
      _sum: { points: true },
    }),
  ]);

  return {
    visits,
    redemptions,
    totalPointsEarned: pointsEarned._sum.points ?? 0,
    period: { start, end },
  };
}

export function convertToCSV(data: any[], columns: { label: string; key: string }[]) {
  const header = columns.map((col) => col.label).join(",");
  const rows = data.map((item) =>
    columns
      .map((col) => {
        const value = col.key.split(".").reduce((obj, key) => obj?.[key], item);
        return `"${String(value ?? "").replace(/"/g, '""')}"`;
      })
      .join(",")
  );
  return [header, ...rows].join("\n");
}
