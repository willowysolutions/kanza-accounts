export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { redirect } from 'next/navigation';
import { CreditReportWithBranchTabs } from "@/components/reports/credit-report-with-branch-tabs";

export default async function CreditReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filter = typeof params.filter === "string" ? params.filter : "all";
  const from = params.from ? new Date(params.from as string) : undefined;
  const to = params.to ? new Date(params.to as string) : undefined;
  const customerFilter = typeof params.customer === "string" ? params.customer : "";
  const page = typeof params.page === "string" ? parseInt(params.page) : 1;

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
  
  // Forward cookies
  const cookie = cookies().toString();
  
  // Build API URL with only defined parameters
  const apiUrl = new URL(`${proto}://${host}/api/credits`);
  apiUrl.searchParams.set('filter', 'all'); // Force 'all' filter to get all credits
  apiUrl.searchParams.set('page', page.toString());
  apiUrl.searchParams.set('limit', '50');
  // Temporarily remove date filtering to test
  // if (from) apiUrl.searchParams.set('from', from.toISOString());
  // if (to) apiUrl.searchParams.set('to', to.toISOString());

  // Fetch credits and branches in parallel
  const [creditsRes, branchesRes] = await Promise.all([
    fetch(apiUrl.toString(), {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/branch`, {
      cache: "no-store",
      headers: { cookie },
    })
  ]);
  
  const { data: credits = [], pagination } = await creditsRes.json();
  const { data: allBranches = [] } = await branchesRes.json();


  // Filter branches based on user role
  const visibleBranches = isAdmin ? allBranches : allBranches.filter((b: { id: string; name: string }) => b.id === (userBranchId ?? ''));

  // Group credits by visible branches only
  const creditsByBranch = visibleBranches.map((branch: { id: string; name: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const branchCredits = (credits || []).filter((c: any) => c.branchId === branch.id);
    
    return {
      branchId: branch.id,
      branchName: branch.name,
      credits: branchCredits
    };
  });

  return (
    <div className="flex flex-1 flex-col">
      <CreditReportWithBranchTabs 
        branches={visibleBranches} 
        creditsByBranch={creditsByBranch}
        filter={filter}
        from={from}
        to={to}
        customerFilter={customerFilter}
        pagination={pagination}
        currentPage={page}
      />
    </div>
  );
}
