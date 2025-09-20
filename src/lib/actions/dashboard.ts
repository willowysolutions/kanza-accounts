import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Today's sales
  const todaysSales = await prisma.sale.groupBy({
    by: ["rate"],
    where: { date: { gte: today } },
    _sum: {
      rate: true,
    },
  });

  //Product Rate
  const todaysRate = await prisma.product.findMany({
    select: {
      id:true,
      productName:true,
      sellingPrice:true
    }
  })

  // Monthly sales
    const monthlySales = await prisma.sale.groupBy({
      by: ["date"],
      where: { date: { gte: monthStart } },
      _sum: {
        rate: true,
      },
    });

    // Monthly purchases
    const monthlyPurchases = await prisma.purchase.groupBy({
      by: ["date"],
      where: { date: { gte: monthStart } },
      _sum: {
        purchasePrice: true,
      },
    });


  // Nozzle counts
  const nozzleCounts = await prisma.nozzle.groupBy({
    by: ["fuelType"],
    _count: { id: true },
  });

  // Stock levels
  const stocks = await prisma.stock.findMany({
    select: { item: true, quantity: true },
  });

  // Outstanding payments
  const outstanding = await prisma.customer.aggregate({
    _sum: { openingBalance: true },
    where: { openingBalance: { lt: 0 } },
  });

  // Recent transactions
  const recentSales = await prisma.sale.findMany({
    take: 5,
    orderBy: { date: "desc" },
    select: {
      id: true,
      date: true,
      hsdDieselTotal: true,
      xgDieselTotal: true,
      msPetrolTotal: true,
      rate: true,
    },
  });

  // Last meter reading date
  const lastMeterReading = await prisma.meterReading.findFirst({
    orderBy: { date: "desc" },
    select: { date: true },
  });

  // Get all sales data (will be paginated in the component)
  const allSales = await prisma.sale.findMany({
    include: {
      branch: true,
    },
    orderBy: { date: "desc" },
  });

  // Get all customer data for dashboard (will be paginated in the component)
  const customers = await prisma.customer.findMany({
    include: {
      branch: true,
    },
    orderBy: { name: "asc" },
  });

  return {
    todaysSales,
    todaysRate,
    monthlySales,
    monthlyPurchases,
    nozzleCounts,
    stocks,
    outstanding: outstanding._sum.openingBalance || 0,
    recentSales,
    lastMeterReadingDate: lastMeterReading?.date,
    allSales,
    customers,
  };
}
