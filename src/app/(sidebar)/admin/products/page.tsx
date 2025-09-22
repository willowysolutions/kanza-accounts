export const dynamic = "force-dynamic";

import { ProductFormDialog } from "@/components/products/product-form";
import { ProductTable } from "@/components/products/product-table";
import { productColumns } from "@/components/products/product-columns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductType } from "@/types/product";
import { ColumnDef } from "@tanstack/react-table";

export default async function ProductPage() {
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
            <ProductFormDialog />
          </div>

          <Tabs defaultValue={branches[0]?.id} className="w-full">
            <TabsList className="mb-4 flex flex-wrap gap-2">
              {branches.map((branch: { id: string; name: string }) => (
                <TabsTrigger key={branch.id} value={branch.id}>
                  {branch.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {productsByBranch.map(({ branchId, branchName, products }: { branchId: string; branchName: string; products: { id: string; productName: string; productUnit: string; purchasePrice: number; sellingPrice: number; branchId: string | null }[] }) => (
              <TabsContent key={branchId} value={branchId}>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">{branchName} Products</h2>
                  <p className="text-sm text-muted-foreground">
                    {products.length} product{products.length !== 1 ? 's' : ''} in this branch
                  </p>
                </div>
                <ProductTable data={products} columns={productColumns as ColumnDef<ProductType, unknown>[]} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
