import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getOptimizedDashboardData } from '@/lib/actions/optimized-dashboard';
import { prisma } from '@/lib/prisma';
import { DashboardWrapper } from '@/components/dashboard/dashboard-wrapper';
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

  // Use optimized dashboard data fetcher
  // For admin users, don't filter by branch to show all data
  const userRole = session?.user?.role ?? '';
  const isAdmin = (userRole.toLowerCase() === 'admin') || (userRole.toLowerCase() === 'gm');
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
    monthlySales,
    monthlyPurchases,
    allSales,
    customers,
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

  // Transform allSales to match expected type (handle fuelTotals JsonValue)
  const transformedSales = allSales.map((sale) => ({
    ...sale,
    fuelTotals: (typeof sale.fuelTotals === 'object' && sale.fuelTotals !== null && !Array.isArray(sale.fuelTotals))
      ? sale.fuelTotals as Record<string, number>
      : null,
  }));

  return (
    <DashboardWrapper
      branches={visibleBranches}
      initialSalesData={salesData}
      initialPurchaseData={purchaseData}
      allSales={transformedSales}
          customers={customers as Customer[]}
          role={session.user.role}
          userBranchId={typeof session.user.branch === 'string' ? session.user.branch : undefined}
          page={page}
      stocksByBranch={stocksByBranch}
    />
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
//       <TabsList className="mb-4 flex flex-wrap gap-2 w-full">
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
