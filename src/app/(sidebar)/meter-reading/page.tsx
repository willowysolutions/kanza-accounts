export const dynamic = "force-dynamic";
import MeterTabManagement from "@/components/meter-tab-management/reading-management";
import { headers, cookies } from "next/headers";
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function MeterReadingPage() {
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
  const cookie = cookies().toString();
  
  // 🔹 Fetch meter readings, sales, and branches (oils will be fetched by the table component)
  const [meterReadingRes, salesRes, branchesRes] = await Promise.all([
    fetch(`${proto}://${host}/api/meterreadings`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/sales`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/branch`, {
      cache: "no-store",
      headers: { cookie },
    })
  ]);
  
  const { withDifference } = await meterReadingRes.json();
  const { sales } = await salesRes.json();
  const { data: allBranches } = await branchesRes.json();

  // Filter branches based on user role
  const visibleBranches = isAdmin ? allBranches : allBranches.filter((b: { id: string; name: string }) => b.id === (userBranchId ?? ''));
  
  return (
    <div className="flex flex-1 flex-col">
      <MeterTabManagement 
        meterReading={withDifference} 
        oil={[]} 
        sales={sales}
        branches={visibleBranches}
      />
    </div>
  );
}
