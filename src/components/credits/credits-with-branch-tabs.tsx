"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditFormDialog } from "@/components/credits/credit-form";
import { CreditTable } from "@/components/credits/credit-table";

type CreditsWithBranchTabsProps = {
  branches: { id: string; name: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  creditsByBranch: { branchId: string; branchName: string; credits: any[] }[];
  userRole?: string;
};

export function CreditsWithBranchTabs({ branches, creditsByBranch, userRole }: CreditsWithBranchTabsProps) {
  const [activeBranch, setActiveBranch] = useState(branches[0]?.id || "");

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Credit Management</h1>
            <p className="text-muted-foreground">Manage customer credits by branch</p>
          </div>
          <CreditFormDialog 
            branchId={activeBranch} 
            userRole={userRole}
            userBranchId={branches.find(b => b.id === activeBranch)?.id}
          />
        </div>

        <Tabs value={activeBranch} onValueChange={setActiveBranch} className="w-full">
          <TabsList className="mb-4 flex flex-wrap gap-2 w-full">
            {branches.map((branch) => (
              <TabsTrigger key={branch.id} value={branch.id}>
                {branch.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {creditsByBranch.map(({ branchId, branchName, credits }) => (
            <TabsContent key={branchId} value={branchId}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{branchName} Credits</h2>
                <p className="text-sm text-muted-foreground">
                  {credits.length} credit{credits.length !== 1 ? 's' : ''} in this branch
                </p>
              </div>
              <CreditTable data={credits} userRole={userRole} branchId={branchId} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
