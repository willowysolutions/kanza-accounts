export const dynamic = "force-dynamic";

import { headers, cookies } from "next/headers";
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PaymentsWithBranchTabs } from "@/components/payments/payments-with-branch-tabs";

export default async function PaymentsPage() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto = hdrs.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  const cookie = (await cookies()).toString();

  // Get session to check user role and branch
  const session = await auth.api.getSession({
    headers: hdrs,
  });

  if (!session) {
    redirect('/login');
  }

  const isAdmin = (session.user.role ?? '').toLowerCase() === 'admin' || (session.user.role ?? '').toLowerCase() === 'gm';
  const isGm = (session.user.role ?? '').toLowerCase() === 'gm';
  const userBranchId = typeof session.user.branch === 'string' ? session.user.branch : undefined;

  // Fetch all required data
  const [dueRes, purchaseDueRes, historyRes, branchesRes] = await Promise.all([
    fetch(`${proto}://${host}/api/payments/due`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/payments/purchase-due`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/payments/history`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/branch`, {
      cache: "no-store",
      headers: { cookie },
    })
  ]);

  const { customers } = await dueRes.json();
  const { suppliers } = await purchaseDueRes.json();
  const { paymentHistory } = await historyRes.json();
  const { data: allBranches } = await branchesRes.json();

  // Filter branches based on user role
  const visibleBranches = isAdmin ? allBranches : allBranches.filter((b: { id: string; name: string }) => b.id === (userBranchId ?? ''));

  // Group payments by visible branches only
  const paymentsByBranch = visibleBranches.map((branch: { id: string; name: string }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const branchCustomers = customers.filter((customer: any) => customer.branchId === branch.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const branchSuppliers = suppliers.filter((supplier: any) => supplier.branchId === branch.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const branchPaymentHistory = paymentHistory.filter((payment: any) => payment.branchId === branch.id);

    return {
      branchId: branch.id,
      branchName: branch.name,
      customers: branchCustomers,
      suppliers: branchSuppliers,
      paymentHistory: branchPaymentHistory,
    };
  });

  return (
    <div className="flex flex-1 flex-col">
      <PaymentsWithBranchTabs 
        branches={visibleBranches} 
        paymentsByBranch={paymentsByBranch}
        userRole={session.user.role || undefined}
        isGm={isGm}
      />
    </div>
  );
}
