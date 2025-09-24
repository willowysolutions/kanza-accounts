import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { getDateRangeIST } from "@/lib/date-utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    const { start, end } = getDateRangeIST(filter, from, to);

    const session = await auth.api.getSession({ headers: await headers() });
    const branchId = session?.user?.branch;
    const branchClause = session?.user?.role === "admin" ? {} : { branchId };

    // Shared date filter
    const dateFilter = start && end ? { gte: start, lte: end } : {};

    // Sales grouped by date
    const sales = await prisma.sale.groupBy({
      by: ["date"],
      _sum: { rate: true },
      where: { ...branchClause, date: dateFilter },
    });

    // Purchases grouped by date
    const purchases = await prisma.purchase.groupBy({
      by: ["date"],
      _sum: { purchasePrice: true },
      where: { ...branchClause, date: dateFilter },
    });

    // Expenses grouped by date
    const expenses = await prisma.expense.groupBy({
      by: ["date"],
      _sum: { amount: true },
      where: { ...branchClause, date: dateFilter },
    });

    // Customer Payments grouped by paidOn date
    const customerPayments = await prisma.paymentHistory.groupBy({
      by: ["paidOn"],
      _sum: { paidAmount: true },
      where: {
        ...branchClause,
        customerId: { not: null },
        paidOn: dateFilter,
      },
    });

    // Merge by date
    const reportMap = new Map<
      string,
      { sales: number; purchases: number; expenses: number; customerPayments: number }
    >();

    sales.forEach((s) => {
      const d = s.date.toISOString().split("T")[0];
      reportMap.set(d, {
        sales: s._sum.rate || 0,
        purchases: 0,
        expenses: 0,
        customerPayments: 0,
      });
    });

    purchases.forEach((p) => {
      const d = p.date.toISOString().split("T")[0];
      const existing = reportMap.get(d) || {
        sales: 0,
        purchases: 0,
        expenses: 0,
        customerPayments: 0,
      };
      reportMap.set(d, { ...existing, purchases: p._sum.purchasePrice || 0 });
    });

    expenses.forEach((e) => {
      const d = e.date.toISOString().split("T")[0];
      const existing = reportMap.get(d) || {
        sales: 0,
        purchases: 0,
        expenses: 0,
        customerPayments: 0,
      };
      reportMap.set(d, { ...existing, expenses: e._sum.amount || 0 });
    });

    customerPayments.forEach((cp) => {
      const d = cp.paidOn.toISOString().split("T")[0];
      const existing = reportMap.get(d) || {
        sales: 0,
        purchases: 0,
        expenses: 0,
        customerPayments: 0,
      };
      reportMap.set(d, { ...existing, customerPayments: cp._sum.paidAmount || 0 });
    });

    // Convert to array
    const rows = Array.from(reportMap.entries()).map(([date, v]) => ({
      date,
      sales: v.sales,
      purchases: v.purchases,
      expenses: v.expenses,
      customerPayments: v.customerPayments,
      finalTotal: v.sales - v.expenses + v.customerPayments,
    }));

    // Sort by date (latest first)
    rows.sort((a, b) => (a.date < b.date ? 1 : -1));

    // Totals
    const totalSales = rows.reduce((acc, r) => acc + r.sales, 0);
    const totalPurchases = rows.reduce((acc, r) => acc + r.purchases, 0);
    const totalExpenses = rows.reduce((acc, r) => acc + r.expenses, 0);
    const totalCustomerPayments = rows.reduce((acc, r) => acc + r.customerPayments, 0);
    const totalFinal = rows.reduce((acc, r) => acc + r.finalTotal, 0);

    return NextResponse.json({
      rows,
      totals: { totalSales, totalPurchases, totalExpenses, totalCustomerPayments, totalFinal },
    });
  } catch (error) {
    console.error("Error in general report:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
