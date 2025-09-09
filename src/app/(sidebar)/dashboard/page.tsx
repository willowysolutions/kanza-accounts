import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDashboardData } from '@/lib/actions/dashboard';
import { ChartAreaInteractive } from '@/components/dashboard/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import {
  IconBottle,
  IconCurrencyDollar,
} from '@tabler/icons-react';
import { Fuel } from 'lucide-react';
import DashboardCharts from '@/components/graphs/sales-purchase-graph';

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const dashboardData = await getDashboardData();

  const {
    todaysRate,
    monthlySales,
    monthlyPurchases,
    stocks,
    recentSales,
  } = dashboardData;

  // Generic groupByMonth function
  function groupByMonth<
    T extends { date: Date; _sum: Record<string, number | null> }
  >(records: T[], key: keyof T["_sum"]) {
    const map = new Map<string, number>();

    records.forEach((r) => {
      const monthKey = new Date(r.date).toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      const current = map.get(monthKey) || 0;
      map.set(monthKey, current + (r._sum[key] as number | null ?? 0));
    });

    return Array.from(map.entries()).map(([month, value]) => ({
      month,
      value,
    }));
  }

const salesData = groupByMonth(monthlySales, "rate");        
const purchaseData = groupByMonth(monthlyPurchases, "purchasePrice"); 



  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className='bg-red-900 text-white'>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className='text-white'>MS-PETROL PRICE</CardDescription>
              <IconCurrencyDollar className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{todaysRate.find(p => p.productName === "MS-PETROL")?.sellingPrice ?? "N/A"}
              </div>
              <div className="text-sm mt-1">
                Available Stock: {stocks.find(s => s.item === "MS-PETROL")?.quantity.toFixed(2) ?? "N/A"} L
              </div>
            </CardContent>
          </Card>

          <Card className='bg-blue-900 text-white'>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className='text-white'>XG-DIESEL PRICE</CardDescription>
              <IconCurrencyDollar className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{todaysRate.find(p => p.productName === "XG-DIESEL")?.sellingPrice ?? "N/A"}
              </div>
              <div className="text-sm mt-1">
                Available Stock: {stocks.find(s => s.item === "XG-DIESEL")?.quantity.toFixed(2) ?? "N/A"} L
              </div>
            </CardContent>
          </Card>


          <Card className='bg-green-900 text-white'>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className='text-white'>HSD-DIESEL PRICE</CardDescription>
              <Fuel className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{todaysRate.find(p => p.productName === "HSD-DIESEL")?.sellingPrice ?? "N/A"}
              </div>
              <div className="text-sm mt-1">
                Available Stock: {stocks.find(s => s.item === "HSD-DIESEL")?.quantity.toFixed(2) ?? "N/A"} L
              </div>
            </CardContent>
          </Card>

          <Card className='bg-black text-white'>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription className='text-white'>OIL PRICE</CardDescription>
              <IconBottle className="h-4 w-4 text-white" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{todaysRate.find(p => p.productName === "2T-OIL")?.sellingPrice ?? "N/A"}
              </div>
              <div className="text-sm mt-1">
                Available Stock: {stocks.find(s => s.item === "2T-OIL")?.quantity.toFixed(2) ?? "N/A"} L
              </div>
            </CardContent>
          </Card>
        </div>

        <ChartAreaInteractive />

        <div className="col-span-2">
          <DashboardCharts purchaseData={purchaseData} salesData={salesData} />
        </div>

        {/* Stock Levels */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {stocks.map((stock) => (
                <li key={stock.item} className="flex justify-between py-2">
                  <span>{stock.item}</span>
                  <span>{(stock.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th>Date</th>
                  <th>HSD-DIESEL</th>
                  <th>XG-DIESEL</th>
                  <th>MS-PETROL</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{new Date(sale.date).toLocaleDateString()}</td>
                    <td>₹{sale.hsdDieselTotal.toFixed(2)}</td>
                    <td>₹{sale.xgDieselTotal.toFixed(2)}</td>
                    <td>₹{sale.msPetrolTotal.toFixed(2)}</td>
                    <td>₹{sale.rate.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
