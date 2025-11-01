"use server";

import { prisma } from "@/lib/prisma";

type ChartData = {
  month: string;
  value: number;
};

/**
 * Get monthly sales and purchases data grouped by month for a specific branch
 */
export async function getMonthlySalesAndPurchases(branchId: string): Promise<{
  salesData: ChartData[];
  purchaseData: ChartData[];
}> {
  // Fetch data for the last 12 months
  const today = new Date();
  const startDate = new Date(today.getFullYear(), today.getMonth() - 11, 1); // Last 12 months
  startDate.setHours(0, 0, 0, 0);

  // Fetch sales grouped by month
  const monthlySales = await prisma.sale.groupBy({
    by: ["date"],
    where: {
      branchId,
      date: { gte: startDate },
    },
    _sum: { rate: true },
    orderBy: { date: 'asc' },
  });

  // Fetch purchases grouped by month
  const monthlyPurchases = await prisma.purchase.groupBy({
    by: ["date"],
    where: {
      branchId,
      date: { gte: startDate },
    },
    _sum: { purchasePrice: true },
    orderBy: { date: 'asc' },
  });

  // Group by month
  const salesMap = new Map<string, number>();
  monthlySales.forEach((sale) => {
    const monthKey = new Date(sale.date).toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    const current = salesMap.get(monthKey) || 0;
    salesMap.set(monthKey, current + (sale._sum.rate || 0));
  });

  const purchaseMap = new Map<string, number>();
  monthlyPurchases.forEach((purchase) => {
    const monthKey = new Date(purchase.date).toLocaleString("default", {
      month: "short",
      year: "numeric",
    });
    const current = purchaseMap.get(monthKey) || 0;
    purchaseMap.set(monthKey, current + (purchase._sum.purchasePrice || 0));
  });

  const salesData: ChartData[] = Array.from(salesMap.entries()).map(([month, value]) => ({
    month,
    value,
  }));

  const purchaseData: ChartData[] = Array.from(purchaseMap.entries()).map(([month, value]) => ({
    month,
    value,
  }));

  return { salesData, purchaseData };
}

