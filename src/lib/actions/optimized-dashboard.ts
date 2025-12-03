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

    // Calculate current month's opening balance for each customer
    // Use same logic as balance sheet report: fetch all data, then filter client-side
    // This ensures IST date format is handled correctly (Dec 1 IST = Nov 30 18:30 UTC in DB)
    const istToday = getCurrentDateIST();
    const monthStartDate = new Date(
      istToday.getFullYear(),
      istToday.getMonth(),
      1,
      0,
      0,
      0,
      0
    );
    const monthStartIstString = monthStartDate.toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });

    // Get all customer IDs
    const customerIds = customers.map(c => c.id);

    // Fetch all credits and payments (no date filter - we'll filter client-side like balance sheet)
    // Fetch last 12 months to ensure we have enough data
    const twelveMonthsAgo = new Date(istToday);
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
    
    const [allCredits, allPayments] = await Promise.all([
      prisma.credit.findMany({
        where: {
          customerId: { in: customerIds },
          date: { gte: twelveMonthsAgo }
        },
        select: {
          customerId: true,
          amount: true,
          date: true
        }
      }),
      prisma.customerPayment.findMany({
        where: {
          customerId: { in: customerIds },
          paidOn: { gte: twelveMonthsAgo }
        },
        select: {
          customerId: true,
          amount: true,
          paidOn: true
        }
      })
    ]);

    // Filter credits and payments before month start (client-side, same as balance sheet)
    // This handles IST date format correctly by comparing IST calendar dates
    const creditsBeforeMonth = allCredits.filter((credit) => {
      if (!credit.customerId) return false;
      const creditIstDateString = new Date(credit.date).toLocaleDateString(
        "en-CA",
        { timeZone: "Asia/Kolkata" }
      );
      return creditIstDateString < monthStartIstString;
    });

    const paymentsBeforeMonth = allPayments.filter((payment) => {
      if (!payment.customerId) return false;
      const paymentIstDateString = new Date(payment.paidOn).toLocaleDateString(
        "en-CA",
        { timeZone: "Asia/Kolkata" }
      );
      return paymentIstDateString < monthStartIstString;
    });

    // Group credits and payments by customer
    const creditsByCustomer = new Map<string, number>();
    creditsBeforeMonth.forEach(credit => {
      if (credit.customerId) {
        const current = creditsByCustomer.get(credit.customerId) || 0;
        creditsByCustomer.set(credit.customerId, current + (credit.amount || 0));
      }
    });

    const paymentsByCustomer = new Map<string, number>();
    paymentsBeforeMonth.forEach(payment => {
      if (payment.customerId) {
        const current = paymentsByCustomer.get(payment.customerId) || 0;
        paymentsByCustomer.set(payment.customerId, current + (payment.amount || 0));
      }
    });

    // Calculate opening balance for current month for each customer
    const customersWithCalculatedOpening = customers.map(customer => {
      const creditsBefore = creditsByCustomer.get(customer.id) || 0;
      const paymentsBefore = paymentsByCustomer.get(customer.id) || 0;
      const calculatedOpeningBalance = (customer.openingBalance || 0) + creditsBefore - paymentsBefore;
      
      return {
        ...customer,
        calculatedOpeningBalance // Add calculated opening balance for current month
      };
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
      customers: customersWithCalculatedOpening,
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
