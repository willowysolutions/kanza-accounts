import { auth } from '@/lib/auth';
import { headers, cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDashboardData } from '@/lib/actions/dashboard';
import { ChartAreaInteractive } from '@/components/dashboard/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WizardButton } from '@/components/dashboard/wizard-button';
import { CustomerDetailsCard } from '@/components/dashboard/customer-details-card';

import {
  IconBottle,
  IconCurrencyDollar,
} from '@tabler/icons-react';
import { Fuel, Calendar } from 'lucide-react';
import DashboardCharts from '@/components/graphs/sales-purchase-graph';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { prisma } from '@/lib/prisma';
import { formatDate } from '@/lib/utils';
import { Customer } from '@/types/customer';

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const page = Number(params.page ?? 0) || 0;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  const dashboardData = await getDashboardData();
  const branches = await prisma.branch.findMany({ orderBy: { name: 'asc' } });

  const {
    todaysRate,
    monthlySales,
    monthlyPurchases,
    stocks,
    lastMeterReadingDate,
    allSales,
    customers,
    // recentSales,
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
    
        {/* Branch Sales Report */}
        <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
              {/* Left side */}
            <CardTitle>Branch Sales Report</CardTitle>
              {/* Right side */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 text-red-500" />
                  <span className='text-red-500'>
                    Last added meter reading: {lastMeterReadingDate 
                      ? formatDate(lastMeterReadingDate)
                      : 'No readings yet'
                    }
                  </span>
                </div>
                <WizardButton />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BranchSalesTabs
              branches={branches}
              allSales={allSales}
              role={session.user.role}
              userBranchId={typeof session.user.branch === 'string' ? session.user.branch : undefined}
              page={page}
            />
          </CardContent>
        </Card>


        {/* Branch Daily Summary */}
        <Card>
          <CardHeader>
              <CardTitle>Branch Daily Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <BranchSummaryTabs
              branches={branches}
              role={session.user.role}
              userBranchId={typeof session.user.branch === 'string' ? session.user.branch : undefined}
              page={page}
            />
          </CardContent>
        </Card>

        {/* Customer Details */}
        <CustomerDetailsCard 
          customers={customers as Customer[]}
          branches={branches}
          role={session.user.role}
          userBranchId={typeof session.user.branch === 'string' ? session.user.branch : undefined}
          page={page}
        />

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

        
      </div>
    </div>
  );
}

async function fetchBranchDailySummary(branchId?: string, dateStr?: string) {
  const hdrs = await headers();
  const host = hdrs.get('host');
  const proto = hdrs.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const cookie = (await cookies()).toString();
  const date = dateStr ?? new Date().toISOString().split('T')[0];
  const url = branchId ? `${proto}://${host}/api/reports/${date}?branchId=${branchId}` : `${proto}://${host}/api/reports/${date}`;
  const res = await fetch(url, { cache: 'no-store', headers: { cookie } });
  const json = await res.json();
  return json?.totals as {
    totalPurchase: number;
    totalSale: number;
    totalExpense: number;
    totalCredit: number;
    salesAndExpense: number;
    totalBalanceReceipt: number;
    salesAndBalaceReceipt: number;
    expenseSum: number;
    cashBalance: number;
  };
}

async function BranchSummaryTabs({ branches, role, userBranchId, page = 0 }: { branches: { id: string; name: string }[]; role?: string | null; userBranchId?: string | undefined; page?: number; }) {
  const isAdmin = (role ?? '').toLowerCase() === 'admin';
  const visibleBranches = isAdmin ? branches : branches.filter(b => b.id === (userBranchId ?? ''));

  // build a rolling list of past dates (latest first)
  const totalDays = 30;
  const pageSize = 5;
  const startIndex = Math.max(page, 0) * pageSize;
  const endIndex = startIndex + pageSize;
  const dates: string[] = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });
  const pageDates = dates.slice(startIndex, endIndex);

  // prefetch summaries for each branch x date on this page
  const summaries = await Promise.all(
    visibleBranches.map(async (b) => ({
      branchId: b.id,
      name: b.name,
      rows: await Promise.all(
        pageDates.map(async (date) => ({
          date,
          totals: await fetchBranchDailySummary(isAdmin ? b.id : undefined, date),
        }))
      ),
    }))
  );

  return (
    <Tabs defaultValue={visibleBranches[0]?.id} className="w-full">
      <TabsList className="mb-4 flex flex-wrap gap-2">
        {visibleBranches.map((b) => (
          <TabsTrigger key={b.id} value={b.id}>{b.name}</TabsTrigger>
        ))}
      </TabsList>

      {summaries.map(({ branchId, rows }) => (
        <TabsContent key={branchId} value={branchId} className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
            <tr className="text-left border-b">
                <th className="p-2">Date</th>
                <th className="p-2">Total Sale</th>
                <th className="p-2">Total Expense</th>
                <th className="p-2">Total Credits</th>
                <th className="p-2">Balance Receipt (Yday)</th>
                <th className="p-2">Cash Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ date, totals }) => (
                <tr key={date} className="border-b hover:bg-muted">
                  <td className="p-2">{formatDate(date)}</td>
                  <td className="p-2">₹{totals.totalSale?.toFixed(2) ?? '0.00'}</td>
                  <td className="p-2">₹{totals.totalExpense?.toFixed(2) ?? '0.00'}</td>
                  <td className="p-2">₹{totals.totalCredit?.toFixed(2) ?? '0.00'}</td>
                  <td className="p-2">₹{totals.totalBalanceReceipt?.toFixed(2) ?? '0.00'}</td>
                  <td className="p-2">₹{totals.cashBalance?.toFixed(2) ?? '0.00'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-end gap-2">
            <a
              href={`?page=${Math.max(page - 1, 0)}`}
              className="inline-flex items-center rounded-md border px-3 py-1 text-sm disabled:opacity-50"
              aria-disabled={page <= 0}
            >
              Previous
            </a>
            <a
              href={`?page=${page + 1}`}
              className="inline-flex items-center rounded-md border px-3 py-1 text-sm"
            >
              Next
            </a>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}

async function BranchSalesTabs({ 
  branches, 
  allSales, 
  role, 
  userBranchId, 
  page = 0 
}: { 
  branches: { id: string; name: string }[]; 
  allSales: {
    id: string;
    date: Date;
    rate: number;
    cashPayment: number;
    atmPayment: number;
    paytmPayment: number;
    fleetPayment: number;
    hsdDieselTotal: number;
    xgDieselTotal: number;
    msPetrolTotal: number;
    branchId: string | null;
    branch: { name: string } | null;
  }[];
  role?: string | null; 
  userBranchId?: string | undefined; 
  page?: number; 
}) {
  const isAdmin = (role ?? '').toLowerCase() === 'admin';
  const visibleBranches = isAdmin ? branches : branches.filter(b => b.id === (userBranchId ?? ''));

  // Pagination settings
  const totalDays = 30;
  const pageSize = 5;
  const startIndex = Math.max(page, 0) * pageSize;
  const endIndex = startIndex + pageSize;

  // Group sales by branch and date
  const branchSalesMap = new Map<string, Map<string, {
    cashPayment: number;
    atmPayment: number;
    paytmPayment: number;
    fleetPayment: number;
    hsdDieselTotal: number;
    xgDieselTotal: number;
    msPetrolTotal: number;
    totalAmount: number;
  }>>();

  // Filter sales for visible branches
  const filteredSales = allSales.filter(sale => {
    if (isAdmin) return true;
    return sale.branchId === userBranchId;
  });

  // Group sales by branch and date
  filteredSales.forEach(sale => {
    const branchId = sale.branchId || 'no-branch';
    const dateKey = sale.date.toLocaleDateString("en-CA"); 
// "YYYY-MM-DD" in local timezone

    
    if (!branchSalesMap.has(branchId)) {
      branchSalesMap.set(branchId, new Map());
    }
    
    const branchMap = branchSalesMap.get(branchId)!;
    const existing = branchMap.get(dateKey) || {
      cashPayment: 0,
      atmPayment: 0,
      paytmPayment: 0,
      fleetPayment: 0,
      hsdDieselTotal: 0,
      xgDieselTotal: 0,
      msPetrolTotal: 0,
      totalAmount: 0,
    };

    branchMap.set(dateKey, {
      cashPayment: existing.cashPayment + (sale.cashPayment || 0),
      atmPayment: existing.atmPayment + (sale.atmPayment || 0),
      paytmPayment: existing.paytmPayment + (sale.paytmPayment || 0),
      fleetPayment: existing.fleetPayment + (sale.fleetPayment || 0),
      hsdDieselTotal: existing.hsdDieselTotal + (sale.hsdDieselTotal || 0),
      xgDieselTotal: existing.xgDieselTotal + (sale.xgDieselTotal || 0),
      msPetrolTotal: existing.msPetrolTotal + (sale.msPetrolTotal || 0),
      totalAmount: existing.totalAmount + (sale.rate || 0),
    });
  });

  // Create date range for pagination
  const dates: string[] = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });
  const pageDates = dates.slice(startIndex, endIndex);

  // Prepare data for each branch
  const branchData = visibleBranches.map(branch => ({
    branchId: branch.id,
    name: branch.name,
    rows: pageDates.map(date => {
      const branchMap = branchSalesMap.get(branch.id);
      const salesData = branchMap?.get(date) || {
        cashPayment: 0,
        atmPayment: 0,
        paytmPayment: 0,
        fleetPayment: 0,
        hsdDieselTotal: 0,
        xgDieselTotal: 0,
        msPetrolTotal: 0,
        totalAmount: 0,
      };
      
      return {
        date,
        sales: salesData,
      };
    }),
  }));

  return (
    <Tabs defaultValue={visibleBranches[0]?.id} className="w-full">
      <TabsList className="mb-4 flex flex-wrap gap-2">
        {visibleBranches.map((b) => (
          <TabsTrigger key={b.id} value={b.id}>{b.name}</TabsTrigger>
        ))}
      </TabsList>

      {branchData.map(({ branchId, rows }) => (
        <TabsContent key={branchId} value={branchId} className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Date</th>
                <th className="p-2">Cash Payment</th>
                <th className="p-2">ATM Payment</th>
                <th className="p-2">Paytm Payment</th>
                <th className="p-2">Fleet Payment</th>
                <th className="p-2">HSD-DIESEL</th>
                <th className="p-2">XG-DIESEL</th>
                <th className="p-2">MS-PETROL</th>
                <th className="p-2">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ date, sales }) => (
                <tr key={date} className="border-b hover:bg-muted">
                  <td className="p-2">{formatDate(date)}</td>
                  <td className="p-2">₹{sales.cashPayment.toFixed(2)}</td>
                  <td className="p-2">₹{sales.atmPayment.toFixed(2)}</td>
                  <td className="p-2">₹{sales.paytmPayment.toFixed(2)}</td>
                  <td className="p-2">₹{sales.fleetPayment.toFixed(2)}</td>
                  <td className="p-2 text-blue-600">₹{sales.hsdDieselTotal.toFixed(2)}</td>
                  <td className="p-2 text-blue-600">₹{sales.xgDieselTotal.toFixed(2)}</td>
                  <td className="p-2 text-red-600">₹{sales.msPetrolTotal.toFixed(2)}</td>
                  <td className="p-2 font-bold">₹{sales.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 flex items-center justify-end gap-2">
            <a
              href={`?page=${Math.max(page - 1, 0)}`}
              className="inline-flex items-center rounded-md border px-3 py-1 text-sm disabled:opacity-50"
              aria-disabled={page <= 0}
            >
              Previous
            </a>
            <a
              href={`?page=${page + 1}`}
              className="inline-flex items-center rounded-md border px-3 py-1 text-sm"
            >
              Next
            </a>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}
