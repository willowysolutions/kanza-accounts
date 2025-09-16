// app/api/report/[date]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const selectedDate = new Date(date);

    // create start & end of the day range
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Purchase
    const purchases = await prisma.purchase.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
    });
    const totalPurchase = purchases.reduce(
      (sum, p) => sum + (p.purchasePrice || 0),
      0
    );

    // Sale
    const sales = await prisma.sale.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
    });
    const totalSale = sales.reduce(
      (sum, s) =>
        sum +
        (s.rate || 0),
      0
    );

    const atmTotal = sales.reduce(
      (sum, s) =>
        sum +
        (s.atmPayment || 0),
      0
    );

    const paytmTotal = sales.reduce(
      (sum, s) =>
        sum +
        (s.paytmPayment || 0),
      0
    );

    const fleetTotal = sales.reduce(
      (sum, s) =>
        sum +
        (s.fleetPayment || 0),
      0
    );

    // Expense
    const expenses = await prisma.expense.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
      include: {
        category: true,
      },
    });


    // Expense = actual expenses - (non-cash payments)
    const totalExpense = expenses.reduce(
    (sum, e) => sum + (e.amount || 0),
    0
    );

    
        

    // Credit
    const credits = await prisma.credit.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
      include:{customer:true},
    });
    const totalCredit = credits.reduce(
      (sum, c) => sum + (c.amount || 0),
      0
    );

    // Meter Readings
    const meterReadings = await prisma.meterReading.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
      include: { nozzle: true, machine: true },
    });

    const oils = await prisma.oil.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
    });

    const bankDeposite = await prisma.bankDeposite.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay } },
      include: {bank:true}
    });

    const bankDepositTotal = bankDeposite.reduce(
        (sum,b) => sum + (b.amount || 0),0
    )

    // Get yesterday's BalanceReceipt
    const yesterday = new Date(startOfDay);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const yesterdayReceipts = await prisma.balanceReceipt.findMany({
      where: {
        date: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
      },
    });

    const totalBalanceReceipt = yesterdayReceipts.reduce(
      (sum, r) => sum + (r.amount || 0),
      0
    );

    const salesAndExpense = totalSale - totalExpense - totalCredit

    const salesAndBalaceReceipt = totalSale + totalBalanceReceipt

    const expenseSum = totalExpense + totalCredit + paytmTotal + atmTotal + fleetTotal;

    const cashBalance = salesAndBalaceReceipt - expenseSum - bankDepositTotal;

    return NextResponse.json({
      date,
      totals: {
        totalPurchase,
        totalSale,
        totalExpense,
        totalCredit,
        salesAndExpense,
        totalBalanceReceipt,
        salesAndBalaceReceipt,
        expenseSum,
        cashBalance,
      },
      purchases,
      sales,
      expenses,
      credits,
      oils,
      bankDeposite,
      meterReadings,
    });
  } catch (err) {
    console.error("Report fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}
