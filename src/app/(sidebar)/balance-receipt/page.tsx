export const dynamic = "force-dynamic";

import { BalanceReceiptFormDialog } from "@/components/balance-receipt/balance-receipt-form";
import { BalanceReceiptTable } from "@/components/balance-receipt/balance-receipt-table";
import { balanceReceiptColumn } from "@/components/balance-receipt/balance-receipt-column";

export default async function SupplierPage() {
    const res = await await fetch("http://localhost:3000/api/balance-receipts")
    const {balanceReceipts} = await res.json() 

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Balance Receipt</h1>
              <p className="text-muted-foreground">Manage Balance Receipts</p>
            </div>
            <BalanceReceiptFormDialog />
          </div>

          <BalanceReceiptTable data={balanceReceipts} columns={balanceReceiptColumn} />
        </div>
      </div>
    </div>
  );
}
