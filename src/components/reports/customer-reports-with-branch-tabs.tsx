"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomerReportTable from "@/components/customers/customer-report-table";

type CustomerReportsWithBranchTabsProps = {
  branches: { id: string; name: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customersByBranch: { branchId: string; branchName: string; customers: any[] }[];
};

export function CustomerReportsWithBranchTabs({ branches, customersByBranch }: CustomerReportsWithBranchTabsProps) {
  const [activeBranch, setActiveBranch] = useState(branches[0]?.id || "");

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Customer Reports</h1>
            <p className="text-muted-foreground">Customer reports by branch</p>
          </div>
        </div>

        <Tabs value={activeBranch} onValueChange={setActiveBranch} className="w-full">
          <TabsList className="mb-4 flex flex-wrap gap-2">
            {branches.map((branch) => (
              <TabsTrigger key={branch.id} value={branch.id}>
                {branch.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {customersByBranch.map(({ branchId, branchName, customers }) => (
            <TabsContent key={branchId} value={branchId}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{branchName} Customer Report</h2>
                <p className="text-sm text-muted-foreground">
                  {customers.length} customer{customers.length !== 1 ? 's' : ''} in this branch
                </p>
              </div>
              <CustomerReportTable customers={customers} branchName={branchName} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
