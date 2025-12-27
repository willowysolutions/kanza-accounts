/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentTabs from "@/components/payments/payment-tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

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
  filter, // eslint-disable-line @typescript-eslint/no-unused-vars
  from,
  to, // eslint-disable-line @typescript-eslint/no-unused-vars
  pagination,
  currentPage // eslint-disable-line @typescript-eslint/no-unused-vars
}: PaymentReportsWithBranchTabsProps) {
  const [activeBranch, setActiveBranch] = useState(branches[0]?.id || "");

  // Month filter options (last 12 months up to current)
  const monthOptions = useMemo(() => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = format(d, "MMMM yyyy");
      options.push({ value, label });
    }

    return options;
  }, []);

  // Determine initial month (from URL range if present, otherwise current month)
  const initialMonthBase = useMemo(() => {
    if (from) return from;
    return new Date();
  }, [from]);

  const initialMonthString = useMemo(
    () =>
      `${initialMonthBase.getFullYear()}-${String(
        initialMonthBase.getMonth() + 1
      ).padStart(2, "0")}`,
    [initialMonthBase]
  );

  const [selectedMonth, setSelectedMonth] = useState(initialMonthString);

  const selectedMonthLabel = useMemo(
    () => monthOptions.find((m) => m.value === selectedMonth)?.label ?? "",
    [monthOptions, selectedMonth]
  );

  // Month change handler: updates URL with from/to for the selected month
  const handleMonthChange = (value: string) => {
    setSelectedMonth(value);
    if (!value) return;

    const [yearStr, monthStr] = value.split("-");
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1; // 0-based

    if (Number.isNaN(year) || Number.isNaN(monthIndex)) return;

    const fromDate = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const toDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    const url = new URL(window.location.href);
    url.searchParams.set("filter", "custom");
    url.searchParams.set("from", fromDate.toISOString());
    url.searchParams.set("to", toDate.toISOString());
    url.searchParams.set("page", "1");
    window.location.href = url.toString();
  };

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payment Reports</h1>
            <p className="text-muted-foreground">Payment reports by branch</p>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">
                Month
              </span>
              <Select
                value={selectedMonth}
                onValueChange={handleMonthChange}
              >
                <SelectTrigger className="w-[220px] bg-white">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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

          {paymentsByBranch.map(({ branchId, branchName, customerPayments, supplierPayments }) => (
            <TabsContent key={branchId} value={branchId}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{branchName} Payment Report</h2>
                <p className="text-sm text-muted-foreground">
                  {customerPayments.length + supplierPayments.length} payment{(customerPayments.length + supplierPayments.length) !== 1 ? 's' : ''} in this branch ({selectedMonthLabel || 'Current Month'})
                </p>
              </div>
              <PaymentTabs
                customerPayments={customerPayments}
                supplierPayments={supplierPayments}
                pagination={pagination}
                branchName={branchName}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
