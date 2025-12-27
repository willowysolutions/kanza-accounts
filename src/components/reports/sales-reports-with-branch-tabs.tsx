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
import { formatCurrency } from "@/lib/utils";
import { SalesReportExport } from "@/components/reports/sales-report-export";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { SalesDateDetailSheet } from "@/components/reports/sales-date-detail-sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

type SalesReportsWithBranchTabsProps = {
  branches: { id: string; name: string }[];
   
  salesByBranch: { branchId: string; branchName: string; sales: any[] }[];
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

export function SalesReportsWithBranchTabs({ 
  branches, 
  salesByBranch, 
  filter, 
  from, 
  to,
  pagination,
  currentPage // eslint-disable-line @typescript-eslint/no-unused-vars
}: SalesReportsWithBranchTabsProps) {
  const [activeBranch, setActiveBranch] = useState(branches[0]?.id || "");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

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
  
  // Get current branch data
  const currentBranchData = salesByBranch.find(branch => branch.branchId === activeBranch);
  const currentSales = currentBranchData?.sales || [];
  
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
            <h1 className="text-2xl font-bold tracking-tight">Sales Reports</h1>
            <p className="text-muted-foreground">Sales reports by branch</p>
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

          {salesByBranch.map(({ branchId, branchName, sales }) => (
            <TabsContent key={branchId} value={branchId}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{branchName} Sales Report</h2>
                <p className="text-sm text-muted-foreground">
                  {sales.length} sale{sales.length !== 1 ? 's' : ''} in this branch ({selectedMonthLabel || 'Current Month'})
                </p>
              </div>
              
              <Card className="p-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Sales Report</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Summary of all sales transactions ({selectedMonthLabel || 'Current Month'})
                    </p>
                  </div>
                  <SalesReportExport sales={sales} filter={filter} from={from} to={to} />
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableCaption>A summary of sales details.</TableCaption>
                    <TableHeader className=" bg-blue-950">
                      <TableRow>
                        <TableHead className="text-white text-left">Date</TableHead>
                        <TableHead className="text-white text-right">ATM Payment</TableHead>
                        <TableHead className="text-white text-right">Paytm Payment</TableHead>
                        <TableHead className="text-white text-right">Fleet Payment</TableHead>
                        <TableHead className="text-white text-right">XG Diesel Total</TableHead>
                        <TableHead className="text-white text-right">HSD Diesel Total</TableHead>
                        <TableHead className="text-white text-right">MS Petrol Total</TableHead>
                        <TableHead className="text-white text-right">Grand Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentSales.map((sale: any) => (
                        <TableRow key={sale.id.toString()}>
                          <TableCell>
                            <button
                              onClick={() => {
                                setSelectedDate(new Date(sale.date));
                                setSheetOpen(true);
                              }}
                              className="text-blue-600 hover:underline cursor-pointer"
                            >
                            {new Date(sale.date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                            </button>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(sale.atmPayment)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(sale.paytmPayment)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(sale.fleetPayment)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(sale.xgDieselTotal || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(sale.hsdDieselTotal || 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(sale.msPetrolTotal || 0)}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(sale.rate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter className="bg-primary text-primary-foreground font-black">
                      <TableRow>
                        <TableCell className="text-right font-medium">
                          Grand Total
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(
                            sales.reduce((sum: number, s: any) => sum + s.atmPayment, 0)
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(
                            sales.reduce((sum: number, s: any) => sum + s.paytmPayment, 0)
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(
                            sales.reduce((sum: number, s: any) => sum + s.fleetPayment, 0)
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold ">
                          {formatCurrency(
                            sales.reduce((sum: number, s: any) => sum + (s.xgDieselTotal || 0), 0)
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(
                            sales.reduce((sum: number, s: any) => sum + (s.hsdDieselTotal || 0), 0)
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(
                            sales.reduce((sum: number, s: any) => sum + (s.msPetrolTotal || 0), 0)
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            sales.reduce((sum: number, s: any) => sum + s.rate, 0)
                          )}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                  
                  {/* Pagination Controls */}
                  {pagination && pagination.totalCount > 0 && (
                    <PaginationControls
                      currentPage={pagination.currentPage}
                      totalPages={pagination.totalPages}
                      onPageChange={goToPage}
                      totalItems={pagination.totalCount}
                      itemsPerPage={pagination.limit}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        <SalesDateDetailSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          selectedDate={selectedDate}
          branchId={activeBranch}
        />
      </div>
    </div>
  );
}
