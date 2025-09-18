export const dynamic = "force-dynamic";

import { SalesTable } from "@/components/sales/sales-table";
import { SalesFormModal } from "@/components/sales/sales-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, CoinsIcon } from "lucide-react";
import { salesColumns } from "@/components/sales/sales-column";
import { Sales } from "@/types/sales";
import { headers, cookies } from "next/headers";


export default async function SalesPage() {
    const hdrs = await headers();
    const host = hdrs.get("host");
    const proto = hdrs.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
    const cookie = (await cookies()).toString();
    const res = await fetch(`${proto}://${host}/api/sales`, {
      cache: "no-store",
      headers: { cookie },
    });
    const { sales } = await res.json();

    const xpDieselTotal = sales.reduce((sum: number, sale: Sales) => sum + sale.xgDieselTotal, 0);

    const hsdDieselTotal = sales.reduce((sum: number, sale: Sales) => sum + sale.hsdDieselTotal, 0);

    const msPetrolTotal = sales.reduce((sum: number, sale: Sales) => sum + sale.msPetrolTotal, 0);


    const totalSale = sales.reduce((sum: number, sale: Sales) => sum + sale.rate, 0);

  return (
    <div className="flex flex-1 flex-col">
    <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">XG Diesel Sold</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
                ₹{xpDieselTotal}
            </div>
            <p className="text-xs text-muted-foreground">Amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">HS Diesel Sold</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
                ₹{hsdDieselTotal}
            </div>
            <p className="text-xs text-muted-foreground">Amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MS Petrol Sold</CardTitle>
            <CoinsIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">
                ₹{msPetrolTotal}
            </div>
            <p className="text-xs text-muted-foreground">Amount</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sold</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
                ₹{totalSale}
            </div>
            <p className="text-xs text-muted-foreground">Amount</p>
          </CardContent>
        </Card>
      </div>
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Sales Management</h1>
              <p className="text-muted-foreground">Track and manage fuel sales transactions</p>
            </div>
            <SalesFormModal />
          </div>

          <SalesTable data={sales} columns={salesColumns}/>
        </div>
      </div>
    </div>
  );
}
