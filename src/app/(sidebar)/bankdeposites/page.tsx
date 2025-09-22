export const dynamic = "force-dynamic";

import { BankDepositeTable } from "@/components/banks-deposite/banks-deposite-table";
import { bankDepositeColumns } from "@/components/banks-deposite/banks-deposite-colums";
import { BankDepositeFormDialog } from "@/components/banks-deposite/banks-deposite-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { headers, cookies } from "next/headers";
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function BankDepositePage() {
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

// Fetch bank deposits and branches
const [bankDepositsRes, branchesRes] = await Promise.all([
  fetch(`${proto}://${host}/api/bank-deposite`, {
    cache: "no-store",
    headers: { cookie },
  }),
  fetch(`${proto}://${host}/api/branch`, {
    cache: "no-store",
    headers: { cookie },
  })
]);

const { bankDeposite } = await bankDepositsRes.json();
const { data: allBranches } = await branchesRes.json();

// Filter branches based on user role
const visibleBranches = isAdmin ? allBranches : allBranches.filter((b: { id: string; name: string }) => b.id === (userBranchId ?? ''));

// Group bank deposits by visible branches only
const depositsByBranch = visibleBranches.map((branch: { id: string; name: string }) => ({
  branchId: branch.id,
  branchName: branch.name,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deposits: bankDeposite.filter((deposit: any) => deposit.branchId === branch.id)
}));

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Bank Deposit Management</h1>
              <p className="text-muted-foreground">Manage your bank deposits by branch</p>
            </div>
            <BankDepositeFormDialog />
          </div>

          <Tabs defaultValue={visibleBranches[0]?.id} className="w-full">
            <TabsList className="mb-4 flex flex-wrap gap-2">
              {visibleBranches.map((branch: { id: string; name: string }) => (
                <TabsTrigger key={branch.id} value={branch.id}>
                  {branch.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {depositsByBranch.map(({ branchId, branchName, deposits }: { branchId: string; branchName: string; deposits: any[] }) => (
              <TabsContent key={branchId} value={branchId}>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">{branchName} Bank Deposits</h2>
                  <p className="text-sm text-muted-foreground">
                    {deposits.length} deposit{deposits.length !== 1 ? 's' : ''} in this branch
                  </p>
                </div>
                <BankDepositeTable data={deposits} columns={bankDepositeColumns} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
