export const dynamic = "force-dynamic";

import { BranchTable } from "@/components/branches/branch-table";
import { BranchFormModal } from "@/components/branches/branch-form";
import { branchColumns } from "@/components/branches/branch-column";

export default async function BranchPage() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/branch`, {
    cache: "no-store", // or "force-cache" if you prefer caching
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
              <BranchFormModal />
          </div>

          <BranchTable columns={branchColumns} data={data} />
        </div>
      </div>
    </div>
  );
}
