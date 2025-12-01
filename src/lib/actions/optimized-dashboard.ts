import { prisma } from "@/lib/prisma";
import { getCurrentDateIST, getStartOfDayIST, getEndOfDayIST } from "@/lib/date-utils";

/**
 * Optimized dashboard data fetcher with proper indexing and caching
 * Fixes performance issues by using efficient queries and proper date handling
 */
export async function getOptimizedDashboardData(branchId?: string) {
  const today = getCurrentDateIST();
  const startOfDay = getStartOfDayIST(today);
  const endOfDay = getEndOfDayIST(today);
  const monthStart = getStartOfDayIST(new Date(today.getFullYear(), today.getMonth(), 1));

  // Branch filter for non-admin users
  const branchFilter = branchId ? { branchId } : {};

  try {
    // Use Promise.all for parallel queries to improve performance
    const [
      todaysSales,
      monthlySales,
      monthlyPurchases,
      nozzleCounts,
      stocks,
      outstanding,
      recentSales,
      lastMeterReading,
      allSales,
      customers
    ] = await Promise.all([
      // Today's sales - optimized with proper indexing
      prisma.sale.aggregate({
        where: { 
          ...branchFilter,
          date: { gte: startOfDay, lte: endOfDay } 
        },
        _sum: { rate: true },
      }),

      // Monthly sales - optimized aggregation
      prisma.sale.groupBy({
        by: ["date"],
        where: { 
          ...branchFilter,
          date: { gte: monthStart } 
        },
        _sum: { rate: true },
        orderBy: { date: 'desc' },
      }),

      // Monthly purchases - optimized aggregation
      prisma.purchase.groupBy({
        by: ["date"],
        where: { 
          ...branchFilter,
          date: { gte: monthStart } 
        },
        _sum: { purchasePrice: true },
        orderBy: { date: 'desc' },
      }),

      // Nozzle counts - simple aggregation
      prisma.nozzle.groupBy({
        by: ["fuelType"],
        where: branchFilter,
        _count: { id: true },
      }),

      // Stock levels - limit results
      prisma.stock.findMany({
        where: branchFilter,
        select: { item: true, quantity: true, branchId: true },
        take: 50, // Limit to prevent large datasets
      }),

      // Outstanding payments - optimized aggregation
      prisma.customer.aggregate({
        where: { 
          ...branchFilter,
          openingBalance: { lt: 0 } 
        },
        _sum: { openingBalance: true },
      }),

      // Recent sales - limit and optimize
      prisma.sale.findMany({
        where: branchFilter,
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
      }),

      // Last meter reading - optimized query
      prisma.meterReading.findFirst({
        where: branchFilter,
        orderBy: { date: "desc" },
        select: { date: true },
      }),

      // All sales - full history for dashboard branch sales report
      prisma.sale.findMany({
        where: branchFilter,
        include: {
          branch: {
            select: { name: true }
          }
        },
        orderBy: { date: "desc" },
      }),

      // Customers - paginated approach with all required fields
      prisma.customer.findMany({
        where: branchFilter,
        select: {
          id: true,
          name: true,
          phone: true,
          openingBalance: true,
          outstandingPayments: true,
          limit: true,
          branchId: true,
          branch: {
            select: { name: true }
          }
        },
        take: 100, // Limit for performance
      }),
    ]);

    // Get product rates
    const todaysRate = await prisma.product.findMany({
      where: branchFilter,
      select: {
        id: true,
        productName: true,
        sellingPrice: true
      }
    });

    return {
      todaysSales: todaysSales._sum.rate || 0,
      todaysRate,
      monthlySales,
      monthlyPurchases,
      nozzleCounts,
      stocks,
      outstanding: outstanding._sum.openingBalance || 0,
      recentSales,
      lastMeterReading: lastMeterReading?.date,
      allSales,
      customers,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw new Error('Failed to fetch dashboard data');
  }
}

/**
 * Optimized branch daily summary fetcher
 * Uses efficient queries with proper date handling
 */
export async function getOptimizedBranchDailySummary(branchId: string, dateStr?: string) {
  const targetDate = dateStr ? new Date(dateStr) : getCurrentDateIST();
  const startOfDay = getStartOfDayIST(targetDate);
  const endOfDay = getEndOfDayIST(targetDate);
  
  // Get yesterday for balance receipt
  const yesterday = new Date(targetDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStart = getStartOfDayIST(yesterday);
  const yesterdayEnd = getEndOfDayIST(yesterday);

  try {
    // Use parallel queries for better performance
    const [
      purchases,
      sales,
      expenses,
      credits,
      meterReadings,
      oils,
      bankDeposits,
      customerPayments,
      yesterdayReceipts
    ] = await Promise.all([
      // Purchases
      prisma.purchase.findMany({
        where: { 
          branchId,
          date: { gte: startOfDay, lte: endOfDay }
        },
        select: { purchasePrice: true }
      }),

      // Sales with branch info
      prisma.sale.findMany({
        where: { 
          branchId,
          date: { gte: startOfDay, lte: endOfDay }
        },
        include: {
          branch: { select: { name: true } }
        }
      }),

      // Expenses with category
      prisma.expense.findMany({
        where: { 
          branchId,
          date: { gte: startOfDay, lte: endOfDay }
        },
        include: { category: true }
      }),

      // Credits with customer
      prisma.credit.findMany({
        where: { 
          branchId,
          date: { gte: startOfDay, lte: endOfDay }
        },
        include: { customer: true }
      }),

      // Meter readings
      prisma.meterReading.findMany({
        where: { 
          branchId,
          date: { gte: startOfDay, lte: endOfDay }
        },
        include: { nozzle: true, machine: true }
      }),

      // Oils
      prisma.oil.findMany({
        where: { 
          branchId,
          date: { gte: startOfDay, lte: endOfDay }
        }
      }),

      // Bank deposits
      prisma.bankDeposite.findMany({
        where: { 
          branchId,
          date: { gte: startOfDay, lte: endOfDay }
        },
        include: { bank: true }
      }),

      // Customer payments
      prisma.customerPayment.findMany({
        where: { 
          branchId,
          paidOn: { gte: startOfDay, lte: endOfDay }
        },
        include: { customer: true }
      }),

      // Yesterday's balance receipts
      prisma.balanceReceipt.findMany({
        where: {
          branchId,
          date: { gte: yesterdayStart, lte: yesterdayEnd }
        }
      })
    ]);

    // Calculate totals efficiently
    const totalPurchase = purchases.reduce((sum, p) => sum + (p.purchasePrice || 0), 0);
    const totalSale = sales.reduce((sum, s) => sum + (s.rate || 0), 0);
    const totalExpense = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalCredit = credits.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalCustomerPayment = customerPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalBalanceReceipt = yesterdayReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);

    // Calculate payment totals
    const atmTotal = sales.reduce((sum, s) => sum + (s.atmPayment || 0), 0);
    const paytmTotal = sales.reduce((sum, s) => sum + (s.paytmPayment || 0), 0);
    const fleetTotal = sales.reduce((sum, s) => sum + (s.fleetPayment || 0), 0);

    return {
      totalPurchase,
      totalSale,
      totalExpense,
      totalCredit,
      salesAndExpense: totalSale - totalExpense,
      totalBalanceReceipt,
      salesAndBalaceReceipt: totalSale + totalBalanceReceipt,
      expenseSum: totalExpense,
      cashBalance: totalSale - totalExpense + totalBalanceReceipt,
      atmTotal,
      paytmTotal,
      fleetTotal,
      totalCustomerPayment,
      meterReadings,
      oils,
      bankDeposits,
      sales,
      expenses,
      credits,
      customerPayments
    };
  } catch (error) {
    console.error('Error fetching branch daily summary:', error);
    throw new Error('Failed to fetch branch daily summary');
  }
}
