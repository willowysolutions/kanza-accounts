"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BankDepositeFormDialog } from "@/components/banks-deposite/banks-deposite-form";
import { BankDepositeTable } from "@/components/banks-deposite/banks-deposite-table";

type BankDepositsWithBranchTabsProps = {
  branches: { id: string; name: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  depositsByBranch: { branchId: string; branchName: string; deposits: any[] }[];
  userRole?: string;
  userBranchId?: string;
};

export function BankDepositsWithBranchTabs({ branches, depositsByBranch, userRole, userBranchId }: BankDepositsWithBranchTabsProps) {
  const [activeBranch, setActiveBranch] = useState(branches[0]?.id || "");

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Bank Deposit Management</h1>
            <p className="text-muted-foreground">Manage your bank deposits by branch</p>
          </div>
          <BankDepositeFormDialog 
            branchId={activeBranch} 
            userRole={userRole}
            userBranchId={userBranchId}
          />
        </div>

        <Tabs value={activeBranch} onValueChange={setActiveBranch} className="w-full">
          <TabsList className="mb-4 flex flex-wrap gap-2">
            {branches.map((branch) => (
              <TabsTrigger key={branch.id} value={branch.id}>
                {branch.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {depositsByBranch.map(({ branchId, branchName, deposits }) => (
            <TabsContent key={branchId} value={branchId}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{branchName} Bank Deposits</h2>
                <p className="text-sm text-muted-foreground">
                  {deposits.length} deposit{deposits.length !== 1 ? 's' : ''} in this branch
                </p>
              </div>
              <BankDepositeTable data={deposits} userRole={userRole} branchId={branchId} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
