export const dynamic = "force-dynamic";

import { BranchTable } from "@/components/branches/branch-table";
import { BranchFormModal } from "@/components/branches/branch-form";
import { branchColumns } from "@/components/branches/branch-column";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function BranchPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isGm = (session?.user.role ?? "").toLowerCase() === "gm";

  const res = await fetch(`${baseUrl}/api/branch`, {
    cache: "no-store", 
  });

  const { data } = await res.json();

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Branch</h1>
              <p className="text-muted-foreground">Manage your branches</p>
            </div>
            {!isGm && <BranchFormModal />}
          </div>

          <BranchTable isGm={isGm} columns={branchColumns} data={data} />
        </div>
      </div>
    </div>
  );
}
