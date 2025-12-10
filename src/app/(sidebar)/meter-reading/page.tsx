export const dynamic = "force-dynamic";
import MeterTabManagement from "@/components/meter-tab-management/reading-management";
import { headers } from "next/headers";
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function MeterReadingPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  
  // Get session to check user role and branch
  const session = await auth.api.getSession({
    headers: hdrs,
  });

  if (!session) {
    redirect('/login');
  }

  const isAdmin = (session.user.role ?? '').toLowerCase() === 'admin';
  const userBranchId = typeof session.user.branch === 'string' ? session.user.branch : undefined;
  
  // 🔹 Forward cookies
  const cookie = hdrs.get("cookie") ?? "";
  const params = searchParams;

  // Get pagination parameters
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;

  // 🔹 Fetch branches first so we can determine the active branch for admin pagination
  const branchesRes = await fetch(`${proto}://${host}/api/branch`, {
    cache: "no-store",
    headers: { cookie },
  });

  const { data: allBranches } = await branchesRes.json();

  // Filter branches based on user role
  const visibleBranches = isAdmin
    ? allBranches
    : allBranches.filter((b: { id: string; name: string }) => b.id === (userBranchId ?? ""));

  // Determine which branch's report we are viewing
  const branchFromQuery =
    typeof params.branchId === "string" ? params.branchId : undefined;

  const activeBranchId =
    branchFromQuery ||
    (!isAdmin ? userBranchId : undefined) ||
    visibleBranches[0]?.id;

  // 🔹 Fetch meter readings (all branches; per-branch filtering is done client-side)
  const meterReadingRes = await fetch(`${proto}://${host}/api/meterreadings`, {
    cache: "no-store",
    headers: { cookie },
  });

  // 🔹 Fetch sales for the active branch only so pagination is branch-specific
  let salesUrl = `${proto}://${host}/api/sales?page=${page}&limit=15`;
  if (activeBranchId) {
    salesUrl += `&branchId=${activeBranchId}`;
  }

  const salesRes = await fetch(salesUrl, {
    cache: "no-store",
    headers: { cookie },
  });

  const { withDifference } = await meterReadingRes.json();
  const { sales, pagination } = await salesRes.json();
  
  return (
    <div className="flex flex-1 flex-col">
      <MeterTabManagement 
        meterReading={withDifference} 
        oil={[]} 
        sales={sales}
        branches={visibleBranches}
        userRole={session.user.role || undefined}
        initialBranchId={activeBranchId}
        salesPagination={pagination}
        currentPage={page}
      />
    </div>
  );
}
