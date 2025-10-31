import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getOptimizedDashboardData } from '@/lib/actions/optimized-dashboard';
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
import { formatDisplayDate, convertToISTDateString } from '@/lib/date-utils';
import { Customer } from '@/types/customer';
import { DownloadReportButton } from '@/components/dashboard/download-report-button';
import { formatDate } from '@/lib/utils';

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

  // Use optimized dashboard data fetcher
  // For admin users, don't filter by branch to show all data
  const isAdmin = (session?.user?.role ?? '').toLowerCase() === 'admin';
  const userBranchId = typeof session?.user?.branch === 'string' ? session.user.branch : undefined;
  const branchFilter = isAdmin ? undefined : userBranchId;
  const dashboardData = await getOptimizedDashboardData(branchFilter);
  const branches = await prisma.branch.findMany({ orderBy: { name: 'asc' } });
  
  // Fetch all stocks for branch-wise display (admin sees all, non-admin sees their branch only)
  const stockWhereClause = isAdmin ? {} : { branchId: userBranchId };
  const allStocks = await prisma.stock.findMany({
    where: stockWhereClause,
    orderBy: { item: 'asc' },
    include: { branch: true }
  });
  
  // Filter branches based on user role for display
  const visibleBranches = isAdmin ? branches : branches.filter(b => b.id === userBranchId);
  
  // Group stocks by branch
  const stocksByBranch = visibleBranches.map((branch: { id: string; name: string }) => ({
    branchId: branch.id,
    branchName: branch.name,
    stocks: allStocks.filter((stock: { branchId: string | null }) => stock.branchId === branch.id)
  }));

  const {
    todaysRate,
    monthlySales,
    monthlyPurchases,
    stocks,
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
          <Card className='bg-blue-950 text-white'>
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

          <Card className='bg-green-600 text-white'>
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


          <Card className='bg-blue-500 text-white'>
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

          <Card className='bg-sky-600 text-white'>
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

        {/* Customer Details */}
        <CustomerDetailsCard 
          customers={customers as Customer[]}
          branches={branches}
          role={session.user.role}
          userBranchId={typeof session.user.branch === 'string' ? session.user.branch : undefined}
          page={page}
        />

        {/* Branch Daily Summary */}
        {/* <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Branch Daily Summary</CardTitle>
              <div className="flex items-center gap-4">
                <WizardButton />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <BranchSummaryTabs
              branches={branches}
              role={session.user.role}
              userBranchId={typeof session.user.branch === 'string' ? session.user.branch : undefined}
              page={page}
            />
          </CardContent>
        </Card> */}
        
    
        {/* Branch Sales Report */}
        <Card>
        <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Branch Sales Report</CardTitle>
              {/* Right side */}
              <div className="flex items-center gap-4">
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



        

        <ChartAreaInteractive />

        <div className="col-span-2">
          <DashboardCharts purchaseData={purchaseData} salesData={salesData} />
        </div>

        {/* Stock Levels - Branch Wise */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={visibleBranches[0]?.id} className="w-full">
              <TabsList className="mb-4 flex flex-wrap gap-2">
                {visibleBranches.map((branch: { id: string; name: string }) => (
                  <TabsTrigger key={branch.id} value={branch.id}>
                    {branch.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {stocksByBranch.map(({ branchId, branchName, stocks }: { branchId: string; branchName: string; stocks: Array<{ item: string; quantity: number; branchId: string | null }> }) => (
                <TabsContent key={branchId} value={branchId}>
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold">{branchName} Stock Levels</h3>
                    <p className="text-xs text-muted-foreground">
                      {stocks.length} stock item{stocks.length !== 1 ? 's' : ''} in this branch
                    </p>
                  </div>
                  <ul className="divide-y">
                    {stocks.length > 0 ? (
                      stocks.map((stock, index) => (
                        <li key={`${stock.item}-${branchId}-${index}`} className="flex justify-between py-2">
                          <span>{stock.item}</span>
                          <span>{(stock.quantity || 0).toFixed(2)}</span>
                        </li>
                      ))
                    ) : (
                      <li className="py-4 text-center text-sm text-muted-foreground">
                        No stock items found for this branch
                      </li>
                    )}
                  </ul>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        
      </div>
    </div>
  );
}

// async function fetchBranchDailySummary(branchId?: string, dateStr?: string) {
//   const hdrs = await headers();
//   const host = hdrs.get('host');
//   const proto = hdrs.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'production' ? 'https' : 'http');
//   const cookie = (await cookies()).toString();
  
//   // Use IST timezone for consistent date handling
//   const date = dateStr ?? convertToISTDateString(getCurrentDateIST());
//   const url = branchId ? `${proto}://${host}/api/reports/${date}?branchId=${branchId}` : `${proto}://${host}/api/reports/${date}`;
//   const res = await fetch(url, { cache: 'no-store', headers: { cookie } });
//   const json = await res.json();
//   return json?.totals as {
//     totalPurchase: number;
//     totalSale: number;
//     totalExpense: number;
//     totalCredit: number;
//     salesAndExpense: number;
//     totalBalanceReceipt: number;
//     salesAndBalaceReceipt: number;
//     expenseSum: number;
//     cashBalance: number;
//   };
// }

// async function BranchSummaryTabs({ branches, role, userBranchId, page = 0 }: { branches: { id: string; name: string }[]; role?: string | null; userBranchId?: string | undefined; page?: number; }) {
//   const isAdmin = (role ?? '').toLowerCase() === 'admin';
//   const visibleBranches = isAdmin ? branches : branches.filter(b => b.id === (userBranchId ?? ''));

//   // Find dates with actual data using efficient database queries
//   const getDatesWithData = async (branchId: string, page: number = 0, pageSize: number = 5) => {
//     const startIndex = page * pageSize;
//     const endIndex = startIndex + pageSize;
    
//     // Get dates from each table and combine them
//     const [salesDates, expenseDates, creditDates, balanceDates] = await Promise.all([
//       prisma.sale.findMany({
//         where: { branchId },
//         select: { date: true },
//         distinct: ['date'],
//         orderBy: { date: 'desc' },
//         take: 20
//       }),
//       prisma.expense.findMany({
//         where: { branchId },
//         select: { date: true },
//         distinct: ['date'],
//         orderBy: { date: 'desc' },
//         take: 20
//       }),
//       prisma.credit.findMany({
//         where: { branchId },
//         select: { date: true },
//         distinct: ['date'],
//         orderBy: { date: 'desc' },
//         take: 20
//       }),
//       prisma.balanceReceipt.findMany({
//         where: { branchId },
//         select: { date: true },
//         distinct: ['date'],
//         orderBy: { date: 'desc' },
//         take: 20
//       })
//     ]);
    
//     // Combine and deduplicate dates
//     const allDates = new Set<string>();
//     [...salesDates, ...expenseDates, ...creditDates, ...balanceDates].forEach(item => {
//       // Convert date to IST date string using robust conversion
//       const dateStr = convertToISTDateString(item.date);
//       allDates.add(dateStr);
//     });
    
//     // Sort dates and apply pagination
//     const sortedDates = Array.from(allDates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
//     return sortedDates.slice(startIndex, endIndex);
//   };

//   // prefetch summaries for each branch with meaningful data only
//   const summaries = await Promise.all(
//     visibleBranches.map(async (b) => {
//       // Get the last meter reading date for this specific branch
//       const branchLastMeterReading = await prisma.meterReading.findFirst({
//         where: { branchId: b.id },
//         orderBy: { date: "desc" },
//         select: { date: true },
//       });

//       // Get dates that have actual data with pagination
//       const datesWithData = await getDatesWithData(b.id, page);

//       return {
//         branchId: b.id,
//         name: b.name,
//         lastMeterReadingDate: branchLastMeterReading?.date,
//         rows: await Promise.all(
//           datesWithData.map(async (date) => ({
//             date,
//             totals: await fetchBranchDailySummary(b.id, date),
//           }))
//         ),
//       };
//     })
//   );

//   return (
//     <Tabs defaultValue={visibleBranches[0]?.id} className="w-full">
//       <TabsList className="mb-4 flex flex-wrap gap-2">
//         {visibleBranches.map((b) => (
//           <TabsTrigger key={b.id} value={b.id}>{b.name}</TabsTrigger>
//         ))}
//       </TabsList>

//       {summaries.map(({ branchId, rows, lastMeterReadingDate: branchLastMeterReadingDate }) => (
//         <TabsContent key={branchId} value={branchId} className="overflow-x-auto">
//           {/* Branch-specific meter reading date */}
//           <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
//             <Calendar className="h-4 w-4 text-red-500" />
//             <span className='text-red-500'>
//               Last meter reading for {visibleBranches.find(b => b.id === branchId)?.name}: {branchLastMeterReadingDate 
//                 ? formatDisplayDate(branchLastMeterReadingDate)
//                 : 'No readings yet'
//               }
//             </span>
//           </div>
//           <table className="w-full text-sm border-collapse">
//             <thead>
//             <tr className="text-left border-b">
//                 <th className="p-2">Date</th>
//                 <th className="p-2">Total Sale</th>
//                 <th className="p-2">Total Expense</th>
//                 <th className="p-2">Total Credits</th>
//                 <th className="p-2">Balance Receipt (Yday)</th>
//                 <th className="p-2">Cash Balance</th>
//               </tr>
//             </thead>
//             <tbody>
//               {rows.map(({ date, totals }) => (
//                 <tr key={date} className="border-b hover:bg-muted">
//                   <td className="p-2">{formatDate(date)}</td>
//                   <td className="p-2">₹{totals.totalSale?.toFixed(2) ?? '0.00'}</td>
//                   <td className="p-2">₹{totals.totalExpense?.toFixed(2) ?? '0.00'}</td>
//                   <td className="p-2">₹{totals.totalCredit?.toFixed(2) ?? '0.00'}</td>
//                   <td className="p-2">₹{totals.totalBalanceReceipt?.toFixed(2) ?? '0.00'}</td>
//                   <td className="p-2">₹{totals.cashBalance?.toFixed(2) ?? '0.00'}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>

//           <div className="mt-4 flex items-center justify-end gap-2">
//             <a
//               href={`?page=${Math.max(page - 1, 0)}`}
//               className="inline-flex items-center rounded-md border px-3 py-1 text-sm disabled:opacity-50"
//               aria-disabled={page <= 0}
//             >
//               Previous
//             </a>
//             <a
//               href={`?page=${page + 1}`}
//               className="inline-flex items-center rounded-md border px-3 py-1 text-sm"
//             >
//               Next
//             </a>
//           </div>
//         </TabsContent>
//       ))}
//     </Tabs>
//   );
// }

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

  // Get meter reading data for each branch
  const branchMeterReadings = await Promise.all(
    visibleBranches.map(async (branch) => {
      const lastMeterReading = await prisma.meterReading.findFirst({
        where: { branchId: branch.id },
        orderBy: { date: "desc" },
        select: { date: true },
      });
      return {
        branchId: branch.id,
        lastMeterReadingDate: lastMeterReading?.date,
      };
    })
  );

  // No pagination - show only meaningful data

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
    originalDate: string; // Store original UTC date for API calls
  }>>();

  // Filter sales for visible branches
  const filteredSales = allSales.filter(sale => {
    if (isAdmin) return true;
    return sale.branchId === userBranchId;
  });

  // Group sales by branch and date
  filteredSales.forEach(sale => {
    const branchId = sale.branchId || 'no-branch';
    const dateKey = convertToISTDateString(sale.date); // IST date for display
    const originalDate = convertToISTDateString(sale.date); // IST date for API calls
    
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
      originalDate: originalDate,
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
      originalDate: originalDate,
    });
  });

  // Get unique dates that have sales data with pagination
  const getDatesWithSalesData = (branchId: string, page: number = 0, pageSize: number = 5) => {
    const branchMap = branchSalesMap.get(branchId);
    if (!branchMap) return [];
    
    const allDates = Array.from(branchMap.keys())
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Sort newest first
    
    // Apply pagination
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    return allDates.slice(startIndex, endIndex);
  };

  // Prepare data for each branch
  const branchData = visibleBranches.map(branch => {
    const datesWithData = getDatesWithSalesData(branch.id, page);
    return {
      branchId: branch.id,
      name: branch.name,
      rows: datesWithData.map(date => {
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
          originalDate: date,
        };
        
        return {
          date,
          sales: salesData,
        };
      }),
    };
  });

  return (
    <Tabs defaultValue={visibleBranches[0]?.id} className="w-full">
      <TabsList className="mb-4 flex flex-wrap gap-2">
        {visibleBranches.map((b) => (
          <TabsTrigger key={b.id} value={b.id}>{b.name}</TabsTrigger>
        ))}
      </TabsList>

      {branchData.map(({ branchId, rows }) => {
        // Get the last meter reading date for this specific branch
        const branchLastMeterReading = branchMeterReadings.find((reading: { branchId: string; lastMeterReadingDate: Date | undefined }) => reading.branchId === branchId)?.lastMeterReadingDate;
        
        return (
          <TabsContent key={branchId} value={branchId} className="overflow-x-auto">
            {/* Branch-specific meter reading date */}
            <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 text-red-500" />
              <span className='text-red-500'>
                Last meter reading for {visibleBranches.find(b => b.id === branchId)?.name}: {branchLastMeterReading 
                  ? formatDisplayDate(branchLastMeterReading)
                  : 'No readings yet'
                }
              </span>
            </div>
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
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .filter(({ sales }) => {
                  // Filter out rows where all values are 0
                  return sales.cashPayment > 0 || 
                         sales.atmPayment > 0 || 
                         sales.paytmPayment > 0 || 
                         sales.fleetPayment > 0 || 
                         sales.hsdDieselTotal > 0 || 
                         sales.xgDieselTotal > 0 || 
                         sales.msPetrolTotal > 0 || 
                         sales.totalAmount > 0;
                })
                .map(({ date, sales }) => (
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
                  <td className="p-2">
                    <DownloadReportButton date={sales.originalDate} branchId={branchId} />
                  </td>
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
        );
      })}
    </Tabs>
  );
}
