import { customerColumns } from "@/components/customers/customer-columns";
import { CustomerFormDialog } from "@/components/customers/customer-form";
import { CustomerTable } from "@/components/customers/customer-table";

export const dynamic = "force-dynamic";


export default async function CustomerPage() {
const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const res = await fetch(`${baseUrl}/api/customers`, {
  cache: "no-store",
});
const { data } = await res.json();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
              <p className="text-muted-foreground">Manage your Customers</p>
            </div>
            <CustomerFormDialog />
          </div>

          <CustomerTable data={data} columns={customerColumns} />
        </div>
      </div>
    </div>
  );
}
