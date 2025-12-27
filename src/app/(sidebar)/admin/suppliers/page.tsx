import { supplierColumns } from "@/components/suppliers/supplier-columns";
import { SupplierFormDialog } from "@/components/suppliers/supplier-form";
import { SupplierTable } from "@/components/suppliers/supplier-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { headers, cookies } from "next/headers";
import { auth } from "@/lib/auth";
export const dynamic = "force-dynamic";


export default async function SupplierPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userRole = session?.user?.role ?? undefined;
  const userBranchId = session?.user?.branch ?? undefined;
  const isGm = (userRole ?? "").toLowerCase() === "gm";

  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const cookie = (await cookies()).toString();
  
  // Fetch suppliers and branches
  const [suppliersRes, branchesRes] = await Promise.all([
    fetch(`${proto}://${host}/api/suppliers`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/branch`, {
      cache: "no-store",
      headers: { cookie },
    })
  ]);
  
  const { data: suppliers } = await suppliersRes.json();
  const { data: branches } = await branchesRes.json();

  // Group suppliers by branch
  const suppliersByBranch = branches.map((branch: { id: string; name: string }) => ({
    branchId: branch.id,
    branchName: branch.name,
    suppliers: suppliers.filter((supplier: { branchId: string | null }) => supplier.branchId === branch.id)
  }));
  
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
              <p className="text-muted-foreground">Manage your Suppliers by branch</p>
            </div>
            {!isGm && <SupplierFormDialog 
              userRole={userRole}
              userBranchId={userBranchId}
            />}
          </div>

          <Tabs defaultValue={branches[0]?.id} className="w-full">
            <TabsList className="mb-4 flex flex-wrap gap-2 w-full">
              {branches.map((branch: { id: string; name: string }) => (
                <TabsTrigger className="data-[state=active]:bg-secondary min-w-[120px] flex-1 data-[state=active]:text-white" key={branch.id} value={branch.id}>
                  {branch.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {suppliersByBranch.map(({ branchId, branchName, suppliers }: { branchId: string; branchName: string; suppliers: any[] }) => (
              <TabsContent key={branchId} value={branchId}>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">{branchName} Suppliers</h2>
                  <p className="text-sm text-muted-foreground">
                    {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} in this branch
                  </p>
                </div>
                <SupplierTable 
                  isGm={isGm}
                  data={suppliers} 
                  columns={supplierColumns} 
                  userRole={userRole}
                  userBranchId={userBranchId}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
