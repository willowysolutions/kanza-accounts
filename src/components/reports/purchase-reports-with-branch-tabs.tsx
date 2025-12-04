/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PurchaseReportExport } from "@/components/reports/purchase-report-export";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

type PurchaseReportsWithBranchTabsProps = {
  branches: { id: string; name: string }[];
   
  purchasesByBranch: { 
    branchId: string; 
    branchName: string; 
    purchases: any[]; 
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
      limit: number;
    };
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

export function PurchaseReportsWithBranchTabs({ 
  branches, 
  purchasesByBranch, 
  filter, 
  from, 
  to,
  pagination, // eslint-disable-line @typescript-eslint/no-unused-vars
  currentPage // eslint-disable-line @typescript-eslint/no-unused-vars
}: PurchaseReportsWithBranchTabsProps) {
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
  
  // Server-side pagination navigation
  const goToPage = (page: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    window.location.href = url.toString();
  };

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Purchase Reports</h1>
            <p className="text-muted-foreground">Purchase reports by branch</p>
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
              <TabsTrigger key={branch.id} value={branch.id}>
                {branch.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {purchasesByBranch.map(({ branchId, branchName, purchases, pagination: branchPagination }) => (
            <TabsContent key={branchId} value={branchId}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{branchName} Purchase Report</h2>
                <p className="text-sm text-muted-foreground">
                  {branchPagination?.totalCount ?? purchases.length} purchase{(branchPagination?.totalCount ?? purchases.length) !== 1 ? 's' : ''} in this branch ({selectedMonthLabel || 'Current Month'})
                </p>
              </div>
              
              <Card className="p-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Purchase Report</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Summary of all purchase transactions ({selectedMonthLabel || 'Current Month'})
                    </p>
                  </div>
                  <PurchaseReportExport purchases={purchases} filter={filter} from={from} to={to} />
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableCaption>A summary of purchase details.</TableCaption>
                    <TableHeader className=" bg-blue-950">
                      <TableRow>
                        <TableHead className="text-white">Date</TableHead>
                        <TableHead className="text-white">Supplier</TableHead>
                        <TableHead className="text-white">Phone</TableHead>
                        <TableHead className="text-white">Product</TableHead>
                        <TableHead className="text-white text-right">Quantity</TableHead>
                        <TableHead className="text-white text-right">Purchase Price</TableHead>
                        <TableHead className="text-white text-right">Paid Amount</TableHead>
                        <TableHead className="text-white text-right">Pending Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            No purchases found for this branch
                          </TableCell>
                        </TableRow>
                      ) : (
                        purchases.map((purchase: any) => (
                          <TableRow key={purchase.id.toString()}>
                            <TableCell>
                            {formatDate(purchase.date)}
                            </TableCell>
                            <TableCell className="font-medium">
                              {purchase.supplier?.name ?? "-"}
                            </TableCell>
                            <TableCell>{purchase.phone}</TableCell>
                            <TableCell>{purchase.productType}</TableCell>
                            <TableCell className="text-right">{purchase.quantity}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(purchase.purchasePrice)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(purchase.paidAmount)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(purchase.pendingAmount)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    <TableFooter className="bg-primary text-primary-foreground font-black">
                      <TableRow>
                        <TableCell colSpan={5} className="text-right font-medium">
                          Grand Total
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            purchases.reduce((sum: number, p: any) => sum + p.purchasePrice, 0)
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            purchases.reduce((sum: number, p: any) => sum + p.paidAmount, 0)
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            purchases.reduce((sum: number, p: any) => sum + p.pendingAmount, 0)
                          )}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                  
                  {/* Pagination Controls */}
                  {branchPagination && branchPagination.totalCount > 0 && (
                    <PaginationControls
                      currentPage={branchPagination.currentPage}
                      totalPages={branchPagination.totalPages}
                      onPageChange={goToPage}
                      totalItems={branchPagination.totalCount}
                      itemsPerPage={branchPagination.limit}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
