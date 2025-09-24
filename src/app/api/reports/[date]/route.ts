// app/api/report/[date]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseDateIST, getStartOfDayIST, getEndOfDayIST } from "@/lib/date-utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const { searchParams } = new URL(req.url);
    const branchId = searchParams.get('branchId');
    
    // Use IST timezone for consistent date handling
    const selectedDate = parseDateIST(date);
    const startOfDay = getStartOfDayIST(selectedDate);
    const endOfDay = getEndOfDayIST(selectedDate);

    // Purchase
    const purchases = await prisma.purchase.findMany({
      where: { 
        date: { gte: startOfDay, lte: endOfDay },
        ...(branchId && { branchId })
      },
    });
    const totalPurchase = purchases.reduce(
      (sum, p) => sum + (p.purchasePrice || 0),
      0
    );

    // Sale
    const sales = await prisma.sale.findMany({
      where: { 
        date: { gte: startOfDay, lte: endOfDay },
        ...(branchId && { branchId })
      },
      include: {
        branch: {
          select: {
            name: true
          }
        }
      }
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
      where: { 
        date: { gte: startOfDay, lte: endOfDay },
        ...(branchId && { branchId })
      },
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
      where: { 
        date: { gte: startOfDay, lte: endOfDay },
        ...(branchId && { branchId })
      },
      include:{customer:true},
    });
    const totalCredit = credits.reduce(
      (sum, c) => sum + (c.amount || 0),
      0
    );

    // Meter Readings
    const meterReadings = await prisma.meterReading.findMany({
      where: { 
        date: { gte: startOfDay, lte: endOfDay },
        ...(branchId && { branchId })
      },
      include: { nozzle: true, machine: true },
    });

    const oils = await prisma.oil.findMany({
      where: { 
        date: { gte: startOfDay, lte: endOfDay },
        ...(branchId && { branchId })
      },
    });

    const bankDeposite = await prisma.bankDeposite.findMany({
      where: { 
        date: { gte: startOfDay, lte: endOfDay },
        ...(branchId && { branchId })
      },
      include: {bank:true}
    });

    const bankDepositTotal = bankDeposite.reduce(
        (sum,b) => sum + (b.amount || 0),0
    )

    // Customer Payments
    const customerPayments = await prisma.customerPayment.findMany({
      where: { 
        paidOn: { gte: startOfDay, lte: endOfDay },
        ...(branchId && { branchId })
      },
      include: {
        customer: true
      }
    });

    const totalCustomerPayment = customerPayments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    // Get yesterday's BalanceReceipt using IST timezone
    const yesterday = new Date(selectedDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStart = getStartOfDayIST(yesterday);
    const yesterdayEnd = getEndOfDayIST(yesterday);

    const yesterdayReceipts = await prisma.balanceReceipt.findMany({
      where: {
        date: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
        ...(branchId && { branchId })
      },
    });

    const totalBalanceReceipt = yesterdayReceipts.reduce(
      (sum, r) => sum + (r.amount || 0),
      0
    );

    const salesAndExpense = totalSale - totalExpense - totalCredit

    const salesAndBalaceReceipt = totalSale + totalBalanceReceipt + totalCustomerPayment

    const expenseSum = totalExpense + totalCredit + paytmTotal + atmTotal + fleetTotal;

    const cashBalance = salesAndBalaceReceipt - expenseSum - bankDepositTotal;

    // Get branch name
    let branchName = "COCO KONDOTTY"; // default
    if (branchId) {
      // If branchId is provided, fetch the branch name
      const branch = await prisma.branch.findUnique({
        where: { id: branchId },
        select: { name: true }
      });
      branchName = branch?.name || "COCO KONDOTTY";
    } else if (sales.length > 0 && sales[0].branch?.name) {
      // Fallback to first sale's branch name
      branchName = sales[0].branch.name;
    }

    return NextResponse.json({
      date,
      branchName,
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
      customerPayments,
    });
  } catch (err) {
    console.error("Report fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}
