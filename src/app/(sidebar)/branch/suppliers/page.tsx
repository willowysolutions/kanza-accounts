export const dynamic = "force-dynamic";

import { supplierColumns } from "@/components/suppliers/supplier-columns";
import { SupplierTable } from "@/components/suppliers/supplier-table";
import { SupplierFormDialog } from "@/components/suppliers/supplier-form";

export default async function SupplierPage() {
    const res = await await fetch("http://localhost:3000/api/suppliers")
    const {data} = await res.json() 

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
              <p className="text-muted-foreground">Manage your Suppliers</p>
            </div>
            <SupplierFormDialog />
          </div>

          <SupplierTable data={data} columns={supplierColumns} />
        </div>
      </div>
    </div>
  );
}
