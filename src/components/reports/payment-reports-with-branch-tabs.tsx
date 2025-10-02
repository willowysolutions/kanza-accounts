/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentTabs from "@/components/payments/payment-tabs";
import { FilterSelect } from "@/components/filters/filter-select";
import { CustomDateFilter } from "@/components/filters/custom-date-filter";

type PaymentReportsWithBranchTabsProps = {
  branches: { id: string; name: string }[];
   
  paymentsByBranch: { 
    branchId: string; 
    branchName: string; 
    customerPayments: any[]; 
    supplierPayments: any[] 
  }[];
  filter: string;
  from?: Date;
  to?: Date;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  currentPage: number;
};

export function PaymentReportsWithBranchTabs({ 
  branches, 
  paymentsByBranch, 
  filter,
  from, // eslint-disable-line @typescript-eslint/no-unused-vars
  to, // eslint-disable-line @typescript-eslint/no-unused-vars
  pagination,
  currentPage // eslint-disable-line @typescript-eslint/no-unused-vars
}: PaymentReportsWithBranchTabsProps) {
  const [activeBranch, setActiveBranch] = useState(branches[0]?.id || "");

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payment Reports</h1>
            <p className="text-muted-foreground">Payment reports by branch</p>
          </div>
          <div className="flex gap-3">
            <FilterSelect defaultValue={filter} />
            <CustomDateFilter />
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

          {paymentsByBranch.map(({ branchId, branchName, customerPayments, supplierPayments }) => (
            <TabsContent key={branchId} value={branchId}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{branchName} Payment Report</h2>
                <p className="text-sm text-muted-foreground">
                  {customerPayments.length + supplierPayments.length} payment{(customerPayments.length + supplierPayments.length) !== 1 ? 's' : ''} in this branch
                </p>
              </div>
              <PaymentTabs
                customerPayments={customerPayments}
                supplierPayments={supplierPayments}
                pagination={pagination}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
