export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { redirect } from 'next/navigation';
import { GeneralReportsWithBranchTabs } from "@/components/reports/general-reports-with-branch-tabs";

export default async function GeneralReportPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filter = typeof params.filter === "string" ? params.filter : "all";
  const from = params.from ? new Date(params.from as string) : undefined;
  const to = params.to ? new Date(params.to as string) : undefined;

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
  
  // Fetch general report data and branches in parallel
  const [generalReportRes, branchesRes] = await Promise.all([
    fetch(`${proto}://${host}/api/reports/general?filter=${filter}&from=${from?.toISOString()}&to=${to?.toISOString()}`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/branch`, {
      cache: "no-store",
      headers: { cookie },
    })
  ]);
  
  const { rows, totals } = await generalReportRes.json();
  const { data: allBranches } = await branchesRes.json();

  // Filter branches based on user role
  const visibleBranches = isAdmin ? allBranches : allBranches.filter((b: { id: string; name: string }) => b.id === (userBranchId ?? ''));

  return (
    <div className="flex flex-1 flex-col">
      <GeneralReportsWithBranchTabs 
        branches={visibleBranches} 
        rows={rows}
        totals={totals}
        filter={filter}
        from={from}
        to={to}
      />
    </div>
  );
}
