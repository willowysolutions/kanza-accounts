"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChartAreaInteractive } from "@/components/dashboard/chart";
import DashboardCharts from "@/components/graphs/sales-purchase-graph";

type BranchGraphsWrapperProps = {
  branches: { id: string; name: string }[];
  initialSalesData?: Array<{ month: string; value: number }>;
  initialPurchaseData?: Array<{ month: string; value: number }>;
};

export function BranchGraphsWrapper({
  branches,
  initialSalesData = [],
  initialPurchaseData = [],
}: BranchGraphsWrapperProps) {
  const [activeBranch, setActiveBranch] = useState(branches[0]?.id || "");

  return (
    <>
      {/* Sales vs Purchases Graph - Branch Wise */}
      <Tabs value={activeBranch} onValueChange={setActiveBranch} className="w-full">
        <TabsList className="mb-4 flex flex-wrap gap-2 w-full">
          {branches.map((branch) => (
            <TabsTrigger key={branch.id} value={branch.id}>
              {branch.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {branches.map((branch) => (
          <TabsContent key={branch.id} value={branch.id}>
            <ChartAreaInteractive branchId={branch.id} />
          </TabsContent>
        ))}
      </Tabs>

      {/* Monthly Sales and Purchases Graphs - Use same branch selection */}
      <div className="w-full">
        <DashboardCharts
          branchId={activeBranch}
          initialSalesData={initialSalesData}
          initialPurchaseData={initialPurchaseData}
        />
      </div>
    </>
  );
}

