/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = "force-dynamic";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { headers, cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BalanceSheetReport } from "@/components/reports/balance-sheet-report";
import { prisma } from "@/lib/prisma";

export default async function BalanceSheetReportPage() {
  const hdrs = await headers();
  // Still read cookies to ensure auth works consistently, even though
  // data for this page is loaded via Prisma instead of HTTP APIs.
  await cookies();

  // Get session to check user role and branch
  const session = await auth.api.getSession({
    headers: hdrs,
  });

  if (!session) {
    redirect('/login');
  }

  const isAdmin = ((session.user.role ?? "").toLowerCase() === "admin") || ((session.user.role ?? "").toLowerCase() === "gm");
  const userBranchId =
    typeof session.user.branch === "string" ? session.user.branch : undefined;

  // Define a rolling 12‑month window (earliest month shown in the UI)
  const now = new Date();
  const twelveMonthsAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 11,
    1,
    0,
    0,
    0,
    0
  );
  const endOfCurrentMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );

  // Common date range filter for the last 12 months
  const dateRangeFilter = {
    gte: twelveMonthsAgo,
    lte: endOfCurrentMonth,
  };

  // Fetch credits, expenses, bank deposits, payments, branches, and sales via Prisma
  const [credits, expenses, bankDeposite, paymentHistory, allBranches, sales] =
    await Promise.all([
      prisma.credit.findMany({
        where: {
          ...(isAdmin || !userBranchId ? {} : { branchId: userBranchId }),
          date: dateRangeFilter,
        },
        include: { customer: true, branch: true },
        orderBy: { date: "desc" },
      }),
      prisma.expense.findMany({
        where: {
          ...(isAdmin || !userBranchId ? {} : { branchId: userBranchId }),
          date: dateRangeFilter,
        },
        include: { category: true, branch: true },
        orderBy: { date: "desc" },
      }),
      prisma.bankDeposite.findMany({
        where: {
          ...(isAdmin || !userBranchId ? {} : { branchId: userBranchId }),
          date: dateRangeFilter,
        },
        include: { bank: true, branch: true },
        orderBy: { date: "desc" },
      }),
      prisma.paymentHistory.findMany({
        where: {
          ...(isAdmin || !userBranchId ? {} : { branchId: userBranchId }),
          paidOn: dateRangeFilter,
        },
        include: { customer: true, supplier: true },
        orderBy: { paidOn: "desc" },
      }),
      prisma.branch.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.sale.findMany({
        where: {
          ...(isAdmin || !userBranchId ? {} : { branchId: userBranchId }),
          date: dateRangeFilter,
        },
        include: { branch: true },
        orderBy: { date: "desc" },
      }),
    ]);

  // Filter branches based on user role
  const visibleBranches = isAdmin
    ? allBranches
    : allBranches.filter(
        (b: { id: string; name: string }) => b.id === (userBranchId ?? "")
      );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Balance Sheet Report</h1>
              <p className="text-muted-foreground">Comprehensive monthly financial overview by branch</p>
            </div>
          </div>

          <Tabs defaultValue={visibleBranches[0]?.id} className="w-full">
            <TabsList className="mb-4 flex flex-wrap gap-2 w-full">
              {visibleBranches.map((branch: { id: string; name: string }) => (
                <TabsTrigger className="data-[state=active]:bg-secondary min-w-[120px] flex-1 data-[state=active]:text-white" key={branch.id} value={branch.id}>
                  {branch.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {visibleBranches.map((branch: { id: string; name: string }) => (
              <TabsContent key={branch.id} value={branch.id}>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">{branch.name} Balance Sheet Report</h2>
                  <p className="text-sm text-muted-foreground">
                    Monthly financial data for {branch.name}
                  </p>
                </div>

                <BalanceSheetReport
                  branchName={branch.name}
                  branchId={branch.id}
                  sales={sales.filter((sale: any) => sale.branchId === branch.id)}
                  credits={credits.filter(
                    (credit: any) => credit.branchId === branch.id
                  )}
                  expenses={expenses.filter(
                    (expense: any) => expense.branchId === branch.id
                  )}
                  bankDeposits={bankDeposite.filter(
                    (deposit: any) => deposit.branchId === branch.id
                  )}
                  payments={paymentHistory.filter(
                    (payment: any) => payment.branchId === branch.id
                  )}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
