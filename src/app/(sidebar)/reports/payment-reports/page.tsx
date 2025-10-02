export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { headers, cookies } from "next/headers";
import { redirect } from 'next/navigation';
import { PaymentReportsWithBranchTabs } from "@/components/reports/payment-reports-with-branch-tabs";

export default async function PaymentHistoryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filter = typeof params.filter === "string" ? params.filter : "all";
  const from = params.from ? new Date(params.from as string) : undefined;
  const to = params.to ? new Date(params.to as string) : undefined;
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
  
  // Fetch payment history and branches in parallel
  const [paymentHistoryRes, branchesRes] = await Promise.all([
    fetch(`${proto}://${host}/api/payments/history?filter=${filter}&from=${from?.toISOString()}&to=${to?.toISOString()}&page=${page}&limit=15`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/branch`, {
      cache: "no-store",
      headers: { cookie },
    })
  ]);
  
  const { paymentHistory = [], pagination } = await paymentHistoryRes.json();
  const { data: allBranches = [] } = await branchesRes.json();

  // Filter branches based on user role
  const visibleBranches = isAdmin ? allBranches : allBranches.filter((b: { id: string; name: string }) => b.id === (userBranchId ?? ''));

  // Group payments by visible branches only
  const paymentsByBranch = visibleBranches.map((branch: { id: string; name: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const branchPayments = (paymentHistory || []).filter((p: any) => 
      p.branchId === branch.id || 
      p.customer?.branchId === branch.id || 
      p.supplier?.branchId === branch.id
    );
    
    // Remove duplicates by using a Set of payment IDs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const uniquePayments = branchPayments.filter((payment: any, index: number, self: any[]) => 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      index === self.findIndex((p: any) => p.id === payment.id)
    );
    
    return {
      branchId: branch.id,
      branchName: branch.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      customerPayments: uniquePayments.filter((p: any) => p.customerId && !p.supplierId),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supplierPayments: uniquePayments.filter((p: any) => p.supplierId && !p.customerId)
    };
  });

  return (
    <div className="flex flex-1 flex-col">
      <PaymentReportsWithBranchTabs 
        branches={visibleBranches} 
        paymentsByBranch={paymentsByBranch}
        filter={filter}
        from={from}
        to={to}
        pagination={pagination}
        currentPage={page}
      />
    </div>
  );
}
