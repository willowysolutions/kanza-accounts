export const dynamic = "force-dynamic";

import { StockTable } from "@/components/stocks/stock-table";
import { stockColumns } from "@/components/stocks/stock-column";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { headers, cookies } from "next/headers";

export default async function StocksPage() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const cookie = (await cookies()).toString();
  
  // Fetch stocks and branches
  const [stocksRes, branchesRes] = await Promise.all([
    fetch(`${proto}://${host}/api/stocks`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/branch`, {
      cache: "no-store",
      headers: { cookie },
    })
  ]);
  
  const { data: stocks } = await stocksRes.json();
  const { data: branches } = await branchesRes.json();

  // Group stocks by branch
  const stocksByBranch = branches.map((branch: { id: string; name: string }) => ({
    branchId: branch.id,
    branchName: branch.name,
    stocks: stocks.filter((stock: { branchId: string | null }) => stock.branchId === branch.id)
  }));

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Stocks</h1>
              <p className="text-muted-foreground">Manage fuel and inventory stock levels by branch</p>
            </div>
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
            {stocksByBranch.map(({ branchId, branchName, stocks }: { branchId: string; branchName: string; stocks: any[] }) => (
              <TabsContent key={branchId} value={branchId}>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold">{branchName} Stocks</h2>
                  <p className="text-sm text-muted-foreground">
                    {stocks.length} stock item{stocks.length !== 1 ? 's' : ''} in this branch
                  </p>
                </div>
                <StockTable data={stocks} columns={stockColumns}/>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
