export const dynamic = "force-dynamic";

import { BalanceReceiptFormDialog } from "@/components/balance-receipt/balance-receipt-form";
import { BalanceReceiptTable } from "@/components/balance-receipt/balance-receipt-table";
import { balanceReceiptColumn } from "@/components/balance-receipt/balance-receipt-column";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { headers, cookies } from "next/headers";

export default async function BalanceReceiptPage() {
const hdrs = await headers();
const host = hdrs.get("host");
const proto = hdrs.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
const cookie = (await cookies()).toString();

// Fetch balance receipts and branches
const [balanceReceiptsRes, branchesRes] = await Promise.all([
  fetch(`${proto}://${host}/api/balance-receipts`, {
    cache: "no-store",
    headers: { cookie },
  }),
  fetch(`${proto}://${host}/api/branch`, {
    cache: "no-store",
    headers: { cookie },
  })
]);

const { balanceReceipts } = await balanceReceiptsRes.json();
const { data: branches } = await branchesRes.json();

// Group balance receipts by branch
const balanceReceiptsByBranch = branches.map((branch: { id: string; name: string }) => ({
  branchId: branch.id,
  branchName: branch.name,
  balanceReceipts: balanceReceipts.filter((receipt: { branchId: string | null }) => receipt.branchId === branch.id)
}));

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Balance Receipt</h1>
              <p className="text-muted-foreground">Manage Balance Receipts by branch</p>
            </div>
            <BalanceReceiptFormDialog />
          </div>

          <Tabs defaultValue={branches[0]?.id} className="w-full">
            <TabsList className="mb-4 flex flex-wrap gap-2">
              {branches.map((branch: { id: string; name: string }) => (
                <TabsTrigger key={branch.id} value={branch.id}>
                  {branch.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {balanceReceiptsByBranch.map(({ branchId, branchName, balanceReceipts }: { branchId: string; branchName: string; balanceReceipts: any[] }) => (
              <TabsContent key={branchId} value={branchId}>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">{branchName} Balance Receipts</h2>
                  <p className="text-sm text-muted-foreground">
                    {balanceReceipts.length} receipt{balanceReceipts.length !== 1 ? 's' : ''} in this branch
                  </p>
                </div>
                <BalanceReceiptTable data={balanceReceipts} columns={balanceReceiptColumn} branchId={branchId} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
