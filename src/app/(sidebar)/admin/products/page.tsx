export const dynamic = "force-dynamic";

import { ProductFormDialog } from "@/components/products/product-form";
import { ProductTable } from "@/components/products/product-table";
import { productColumns } from "@/components/products/product-columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ProductType } from "@/types/product";

export default async function ProductPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userRole = session?.user?.role ?? undefined;
  const userBranchId = session?.user?.branch ?? undefined;
  const isGm = (userRole ?? '').toLowerCase() === 'gm';


  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  
  // Fetch products and branches
  const [productsRes, branchesRes] = await Promise.all([
    fetch(`${baseUrl}/api/products`, { cache: "no-store" }),
    fetch(`${baseUrl}/api/branch`, { cache: "no-store" })
  ]);
  
  const { data: products } = await productsRes.json();
  const { data: branches } = await branchesRes.json();

  // Group products by branch
  const productsByBranch = branches.map((branch: { id: string; name: string }) => ({
    branchId: branch.id,
    branchName: branch.name,
    products: products.filter((product: { branchId: string | null }) => product.branchId === branch.id)
  }));

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Products</h1>
              <p className="text-muted-foreground">Manage your Products by Branch</p>
            </div>
            {!isGm && <ProductFormDialog 
              userRole={userRole}
              userBranchId={userBranchId}
            />}
          </div>

          <Tabs defaultValue={branches[0]?.id} className="w-full">
            <TabsList className="mb-4 flex flex-wrap gap-2 w-full">
              {branches.map((branch: { id: string; name: string }) => (
                <TabsTrigger key={branch.id} value={branch.id}>
                  {branch.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {productsByBranch.map(({ branchId, branchName, products }: { branchId: string; branchName: string; products: { id: string; productName: string; productCategory?: "FUEL" | "OTHER"; productUnit: string; purchasePrice: number; sellingPrice: number; branchId: string | null }[] }) => {
              // Define fuel product names (case-insensitive matching)
              const fuelProductNames = ["MS-PETROL", "HSD-DIESEL", "XG-DIESEL", "XP 95 PETROL", "POWER PETROL"];
              
              // Split products: fuel products must match one of the specific fuel product names
              const fuelProducts = products.filter((p: { productName: string; productCategory?: "FUEL" | "OTHER" }) => {
                const normalizedName = p.productName.toUpperCase().trim();
                return fuelProductNames.some(fuelName => 
                  normalizedName === fuelName.toUpperCase().trim()
                );
              });
              
              // All other products go to OTHER category
              const otherProducts = products.filter((p: { productName: string; productCategory?: "FUEL" | "OTHER" }) => {
                const normalizedName = p.productName.toUpperCase().trim();
                return !fuelProductNames.some(fuelName => 
                  normalizedName === fuelName.toUpperCase().trim()
                );
              });
              
              return (
                <TabsContent key={branchId} value={branchId}>
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold">{branchName} Products</h2>
                    <p className="text-sm text-muted-foreground">
                      {products.length} product{products.length !== 1 ? 's' : ''} in this branch
                    </p>
                  </div>
                  
                  <Tabs defaultValue="fuel" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="fuel">Fuel Products ({fuelProducts.length})</TabsTrigger>
                      <TabsTrigger value="other">Other Products ({otherProducts.length})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="fuel">
                      <ProductTable 
                        data={fuelProducts as ProductType[]} 
                        columns={productColumns}
                        isGm = {isGm}
                        userRole={userRole}
                        userBranchId={userBranchId}
                      />
                    </TabsContent>
                    
                    <TabsContent value="other">
                      <ProductTable 
                        data={otherProducts as ProductType[]} 
                        columns={productColumns} 
                        isGm = {isGm}
                        userRole={userRole}
                        userBranchId={userBranchId}
                      />
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
