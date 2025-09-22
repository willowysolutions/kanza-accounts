export const dynamic = "force-dynamic";

import BankManagement from "@/components/banks/bank-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { headers, cookies } from "next/headers";

export default async function BankPage() {
  const hdrs = await headers();
  const host = hdrs.get("host");
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const cookie = (await cookies()).toString();
  
  // Fetch banks, bank deposits, and branches
  const [banksRes, depositsRes, branchesRes] = await Promise.all([
    fetch(`${proto}://${host}/api/banks`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/bank-deposite`, {
      cache: "no-store",
      headers: { cookie },
    }),
    fetch(`${proto}://${host}/api/branch`, {
      cache: "no-store",
      headers: { cookie },
    })
  ]);
  
  const { banks } = await banksRes.json();
  const { bankDeposite } = await depositsRes.json();
  const { data: branches } = await branchesRes.json();

  // Group banks and deposits by branch
  const banksByBranch = branches.map((branch: { id: string; name: string }) => ({
    branchId: branch.id,
    branchName: branch.name,
    banks: banks.filter((bank: { branchId: string | null }) => bank.branchId === branch.id),
    bankDeposite: bankDeposite.filter((deposit: { branchId: string | null }) => deposit.branchId === branch.id)
  }));
    
  return (
    <div className="flex flex-1 flex-col">
      <Tabs defaultValue={branches[0]?.id} className="w-full">
        <TabsList className="mb-4 flex flex-wrap gap-2">
          {branches.map((branch: { id: string; name: string }) => (
            <TabsTrigger key={branch.id} value={branch.id}>
              {branch.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {banksByBranch.map(({ branchId, branchName, banks, bankDeposite }: { branchId: string; branchName: string; banks: any[]; bankDeposite: any[] }) => (
          <TabsContent key={branchId} value={branchId}>
            <div className="mb-4">
              <h2 className="text-lg font-semibold">{branchName} Banks</h2>
              <p className="text-sm text-muted-foreground">
                {banks.length} bank{banks.length !== 1 ? 's' : ''} and {bankDeposite.length} deposit{bankDeposite.length !== 1 ? 's' : ''} in this branch
              </p>
            </div>
            <BankManagement bank={banks} bankDeposite={bankDeposite}/>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
