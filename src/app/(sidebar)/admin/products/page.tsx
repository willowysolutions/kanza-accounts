export const dynamic = "force-dynamic";

import { ProductFormDialog } from "@/components/products/product-form";
import { ProductTable } from "@/components/products/product-table";
import { productColumns } from "@/components/products/product-columns";

export default async function ProductPage() {
    const res = await await fetch("http://localhost:3000/api/products")
    const {data} = await res.json() 

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Products</h1>
              <p className="text-muted-foreground">Manage your Products</p>
            </div>
            <ProductFormDialog />
          </div>

          <ProductTable data={data} columns={productColumns} />
        </div>
      </div>
    </div>
  );
}
