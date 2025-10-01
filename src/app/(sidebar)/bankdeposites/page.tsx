export const dynamic = "force-dynamic";

import { headers, cookies } from "next/headers";
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BankDepositsWithBranchTabs } from "@/components/banks-deposite/bank-deposits-with-branch-tabs";

export default async function BankDepositePage() {
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

const isAdmin = (session.user.role ?? '').toLowerCase() === 'admin';
const userBranchId = typeof session.user.branch === 'string' ? session.user.branch : undefined;

// Fetch bank deposits and branches
const [bankDepositsRes, branchesRes] = await Promise.all([
  fetch(`${proto}://${host}/api/bank-deposite`, {
    cache: "no-store",
    headers: { cookie },
  }),
  fetch(`${proto}://${host}/api/branch`, {
    cache: "no-store",
    headers: { cookie },
  })
]);

const { bankDeposite } = await bankDepositsRes.json();
const { data: allBranches } = await branchesRes.json();

// Filter branches based on user role
const visibleBranches = isAdmin ? allBranches : allBranches.filter((b: { id: string; name: string }) => b.id === (userBranchId ?? ''));

// Group bank deposits by visible branches only
const depositsByBranch = visibleBranches.map((branch: { id: string; name: string }) => ({
  branchId: branch.id,
  branchName: branch.name,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deposits: bankDeposite.filter((deposit: any) => deposit.branchId === branch.id)
}));

  return (
    <div className="flex flex-1 flex-col">
      <BankDepositsWithBranchTabs 
        branches={visibleBranches} 
        depositsByBranch={depositsByBranch}
        userRole={session.user.role || undefined}
        userBranchId={userBranchId}
      />
    </div>
  );
}
