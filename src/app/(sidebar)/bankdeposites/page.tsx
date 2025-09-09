export const dynamic = "force-dynamic";

import { BankDepositeTable } from "@/components/banks-deposite/banks-deposite-table";
import { bankDepositeColumns } from "@/components/banks-deposite/banks-deposite-colums";
import { BankDepositeFormDialog } from "@/components/banks-deposite/banks-deposite-form";

export default async function BankDepositePage() {
    const resDeposite = await await fetch("http://localhost:3000/api/bank-deposite")
    const {bankDeposite} = await resDeposite.json() 

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Bank Deposites</h1>
              <p className="text-muted-foreground">Manage your Deposites</p>
            </div>
            <BankDepositeFormDialog />
          </div>

          <BankDepositeTable data={bankDeposite} columns={bankDepositeColumns} />
        </div>
      </div>
    </div>
  );
}
