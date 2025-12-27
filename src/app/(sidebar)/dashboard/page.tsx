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
