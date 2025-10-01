/* eslint-disable @typescript-eslint/no-explicit-any */
export const dynamic = "force-dynamic";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { headers, cookies } from "next/headers";
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BalanceSheetReport } from "@/components/reports/balance-sheet-report";

export default async function BalanceSheetReportPage() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const cookie = (await cookies()).toString();

  // Get session to check user role and branch
  const session = await auth.api.getSession({
    headers: hdrs,
  });

  if (!session) {
    redirect('/login');
  }

  const isAdmin = (session.user.role ?? '').toLowerCase() === 'admin';
  const userBranchId = typeof session.user.branch === 'string' ? session.user.branch : undefined;

  // Fetch all required data
  const [salesRes, creditsRes, expensesRes, bankDepositsRes, paymentsRes, branchesRes] = await Promise.all([
    fetch(`${proto}://${host}/api/sales`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/credits`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/expenses`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/bank-deposite?limit=1000`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/payments/history`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/branch`, {
      cache: "no-store",
      headers: { cookie },
    })
  ]);

  const { sales } = await salesRes.json();
  const { data: credits } = await creditsRes.json();
  const { data: expenses } = await expensesRes.json();
  const { bankDeposite } = await bankDepositsRes.json();
  const { paymentHistory } = await paymentsRes.json();
  const { data: allBranches } = await branchesRes.json();

  // Filter branches based on user role
  const visibleBranches = isAdmin ? allBranches : allBranches.filter((b: { id: string; name: string }) => b.id === (userBranchId ?? ''));

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
            <TabsList className="mb-4 flex flex-wrap gap-2">
              {visibleBranches.map((branch: { id: string; name: string }) => (
                <TabsTrigger key={branch.id} value={branch.id}>
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
                  sales={sales.filter((sale: any) => sale.branchId === branch.id)}
                  credits={credits.filter((credit: any) => credit.branchId === branch.id)}
                  expenses={expenses.filter((expense: any) => expense.branchId === branch.id)}
                  bankDeposits={bankDeposite.filter((deposit: any) => deposit.branchId === branch.id)}
                  payments={paymentHistory.filter((payment: any) => payment.branchId === branch.id)}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
