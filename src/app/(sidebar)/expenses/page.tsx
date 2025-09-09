export const dynamic = "force-dynamic";
import { expenseColumns } from "@/components/expenses/expense-colums";
import { ExpenseTable } from "@/components/expenses/expense-table";
import { ExpenseFormDialog } from "@/components/expenses/expense-form";

export default async function ExpensePage() {
    const res = await await fetch("http://localhost:3000/api/expenses")
    const {data} = await res.json() 

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Expense</h1>
              <p className="text-muted-foreground">Manage your Expense</p>
            </div>
              <ExpenseFormDialog />
          </div>
          <ExpenseTable columns={expenseColumns} data={data} />
        </div>
      </div>
    </div>
  );
}
