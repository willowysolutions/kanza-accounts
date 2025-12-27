"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditReportTable } from "./credit-report-table";

interface CreditReportWithBranchTabsProps {
  branches: { id: string; name: string }[];
  creditsByBranch: Array<{
    branchId: string;
    branchName: string;
    credits: unknown[];
  }>;
  filter: string;
  from?: Date;
  to?: Date;
  customerFilter: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  currentPage: number;
}

export function CreditReportWithBranchTabs({
  branches,
  creditsByBranch,
  customerFilter,
  pagination,
  currentPage,
}: CreditReportWithBranchTabsProps) {
  const [activeBranch, setActiveBranch] = useState(branches[0]?.id || "");

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Credit Report</h1>
            <p className="text-muted-foreground">View credit transactions by branch</p>
          </div>
        </div>

        <Tabs value={activeBranch} onValueChange={setActiveBranch} className="w-full">
          <TabsList className="mb-4 flex flex-wrap gap-2 w-full">
            {branches.map((branch) => (
              <TabsTrigger className="data-[state=active]:bg-secondary min-w-[120px] flex-1 data-[state=active]:text-white" key={branch.id} value={branch.id}>
                {branch.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {creditsByBranch.map(({ branchId, branchName, credits }) => (
            <TabsContent key={branchId} value={branchId} className="flex-1">
              <CreditReportTable 
                credits={credits}
                branchName={branchName}
                branchId={branchId}
                customerFilter={customerFilter}
                pagination={pagination}
                currentPage={currentPage}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
