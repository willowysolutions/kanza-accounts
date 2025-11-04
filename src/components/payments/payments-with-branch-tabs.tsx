"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentManagement } from "@/components/payments/payment-management";

type PaymentsWithBranchTabsProps = {
  branches: { id: string; name: string }[];
  paymentsByBranch: { 
    branchId: string; 
    branchName: string; 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    customers: any[]; 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    suppliers: any[]; 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paymentHistory: any[] 
  }[];
  userRole?: string;
};

export function PaymentsWithBranchTabs({ branches, paymentsByBranch, userRole }: PaymentsWithBranchTabsProps) {
  const [activeBranch, setActiveBranch] = useState(branches[0]?.id || "");

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payment Management</h1>
            <p className="text-muted-foreground">Manage fuel and inventory payments by branch</p>
          </div>
        </div>

        <Tabs value={activeBranch} onValueChange={setActiveBranch} className="w-full">
          <TabsList className="mb-4 flex flex-wrap gap-2 w-full">
            {branches.map((branch) => (
              <TabsTrigger key={branch.id} value={branch.id}>
                {branch.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {paymentsByBranch.map(({ branchId, branchName, customers, suppliers, paymentHistory }) => (
            <TabsContent key={branchId} value={branchId}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{branchName} Payments</h2>
                <p className="text-sm text-muted-foreground">
                  Manage payments for {branchName} branch
                </p>
              </div>
              <PaymentManagement 
                customerPayment={customers} 
                supplierPayment={suppliers} 
                paymentHistory={paymentHistory}
                userRole={userRole}
                branchId={branchId}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
