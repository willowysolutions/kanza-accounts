"use client";

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { FilterSelect } from "@/components/filters/filter-select";
import { CustomDateFilter } from "@/components/filters/custom-date-filter";
import { GeneralReportExport } from "@/components/reports/general-report-export";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/use-pagination";

type Rows = {
  date: Date;
  sales: number;
  purchases: number;
  expenses: number;
  customerPayments: number;
  finalTotal: number;
};

type GeneralReportsWithBranchTabsProps = {
  branches: { id: string; name: string }[];
  rows: Rows[];
  totals: {
    totalSales: number;
    totalPurchases: number;
    totalExpenses: number;
    totalCustomerPayments: number;
    totalFinal: number;
  };
  filter: string;
  from?: Date;
  to?: Date;
};

export function GeneralReportsWithBranchTabs({ 
  branches, 
  rows, 
  totals, 
  filter, 
  from, 
  to 
}: GeneralReportsWithBranchTabsProps) {
  const [activeBranch, setActiveBranch] = useState(branches[0]?.id || "");
  
  // Use pagination hook
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedRows,
    goToPage,
    totalItems,
    itemsPerPage,
  } = usePagination({ data: rows, itemsPerPage: 15 });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">General Reports</h1>
            <p className="text-muted-foreground">General reports by branch</p>
          </div>
          <div className="flex gap-3">
            <FilterSelect defaultValue={filter} />
            <CustomDateFilter />
            <GeneralReportExport
              rows={rows}
              totals={totals}
              filter={filter}
              from={from}
              to={to}
            />
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

          {branches.map((branch) => (
            <TabsContent key={branch.id} value={branch.id}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{branch.name} General Report</h2>
                <p className="text-sm text-muted-foreground">
                  Summary of all transactions for {branch.name} ({filter})
                </p>
              </div>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>General Report (Summary)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-left">Date</TableHead>
                        <TableHead className="text-right">Total Sales</TableHead>
                        <TableHead className="text-right">Total Purchases</TableHead>
                        <TableHead className="text-right">Total Expenses</TableHead>
                        <TableHead className="text-right">Credit Received</TableHead>
                        <TableHead className="text-right">Final Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRows.map((row: Rows) => (
                        <TableRow key={new Date(row.date).toISOString()}>
                          <TableCell>{formatDate(row.date)}</TableCell>
                          <TableCell className="text-right">
                            ₹{row.sales.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{row.purchases.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{row.expenses.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            ₹{row.customerPayments.toLocaleString()}
                          </TableCell>
                          <TableCell
                            className={`text-right ${
                              row.finalTotal >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            ₹{row.finalTotal.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="font-semibold">
                        <TableCell className="text-right">Grand Total</TableCell>
                        <TableCell className="text-right">
                          ₹{totals.totalSales.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{totals.totalPurchases.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{totals.totalExpenses.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{totals.totalCustomerPayments.toLocaleString()}
                        </TableCell>
                        <TableCell
                          className={`text-right ${
                            totals.totalFinal >= 0 ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          ₹{totals.totalFinal.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                  
                  {/* Pagination Controls */}
                  {totalItems > 0 && (
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={goToPage}
                      totalItems={totalItems}
                      itemsPerPage={itemsPerPage}
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
