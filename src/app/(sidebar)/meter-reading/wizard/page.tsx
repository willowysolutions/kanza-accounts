export const dynamic = "force-dynamic";

import React from 'react';
import { headers, cookies } from "next/headers";
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { WizardWithBranchTabs } from '@/components/wizard/wizard-with-branch-tabs';

export default async function WizardPage() {
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
  
  // Fetch branches
  const branchesRes = await fetch(`${proto}://${host}/api/branch`, {
    cache: "no-store",
    headers: { cookie },
  });
  
  const { data: allBranches } = await branchesRes.json();

  // Filter branches based on user role
  const visibleBranches = isAdmin ? allBranches : allBranches.filter((b: { id: string; name: string }) => b.id === (userBranchId ?? ''));
  
  return (
    <div className="flex flex-1 flex-col">
      <WizardWithBranchTabs branches={visibleBranches} />
    </div>
  );
}
