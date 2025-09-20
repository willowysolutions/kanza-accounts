export const dynamic = "force-dynamic";

import { StockTable } from "@/components/stocks/stock-table";
import { stockColumns } from "@/components/stocks/stock-column";
import { headers, cookies } from "next/headers";

export default async function StocksPage() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const cookie = (await cookies()).toString();
  const res = await fetch(`${proto}://${host}/api/stocks`, {
    cache: "no-store",
    headers: { cookie },
  });
  const { data } = await res.json();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Stocks</h1>
              <p className="text-muted-foreground">Manage fuel and inventory stock levels</p>
            </div>
          </div>

          <StockTable data={data} columns={stockColumns}/>
        </div>
      </div>
    </div>
  );
}
