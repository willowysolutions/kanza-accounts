import { customerColumns } from "@/components/customers/customer-columns";
import { CustomerFormDialog } from "@/components/customers/customer-form";
import { CustomerTable } from "@/components/customers/customer-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { headers, cookies } from "next/headers";
export const dynamic = "force-dynamic";


export default async function CustomerPage() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const cookie = (await cookies()).toString();
  
  // Fetch customers and branches
  const [customersRes, branchesRes] = await Promise.all([
    fetch(`${proto}://${host}/api/customers`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/branch`, {
      cache: "no-store",
      headers: { cookie },
    })
  ]);
  
  const { data: customers } = await customersRes.json();
  const { data: branches } = await branchesRes.json();

  // Group customers by branch
  const customersByBranch = branches.map((branch: { id: string; name: string }) => ({
    branchId: branch.id,
    branchName: branch.name,
    customers: customers.filter((customer: { branchId: string | null }) => customer.branchId === branch.id)
  }));
  
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
              <p className="text-muted-foreground">Manage your Customers by branch</p>
            </div>
            <CustomerFormDialog />
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
            {customersByBranch.map(({ branchId, branchName, customers }: { branchId: string; branchName: string; customers: any[] }) => (
              <TabsContent key={branchId} value={branchId}>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">{branchName} Customers</h2>
                  <p className="text-sm text-muted-foreground">
                    {customers.length} customer{customers.length !== 1 ? 's' : ''} in this branch
                  </p>
                </div>
                <CustomerTable data={customers} columns={customerColumns} branchId={branchId} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
