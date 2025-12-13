import { ExpenseTable } from "@/components/expense-category/expense-category-table";
import { ExpenseCategoryFormDialog } from "@/components/expense-category/expense-category-form";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ExpenseCategoryPage() {

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const hdrs = await headers();
  // Get session to check user role and branch
  const session = await auth.api.getSession({
    headers: hdrs,
  });

  if (!session) {
    redirect('/login');
  }

  const isGm = (session.user.role ?? '').toLowerCase() === 'gm';
  const userRole = session.user.role || undefined;

const res = await fetch(`${baseUrl}/api/expensescategory`, {
  cache: "no-store",
});
const { data } = await res.json();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Expense Category</h1>
              <p className="text-muted-foreground">Manage your Expense Category</p>
            </div>
              {!isGm && <ExpenseCategoryFormDialog />}
          </div>

          <ExpenseTable data={data} userRole={userRole} />
        </div>
      </div>
    </div>
  );
}
