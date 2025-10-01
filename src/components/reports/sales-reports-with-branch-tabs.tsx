/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from 'react';
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
import { FilterSelect } from "@/components/filters/filter-select";
import { CustomDateFilter } from "@/components/filters/custom-date-filter";
import { SalesReportExport } from "@/components/reports/sales-report-export";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/use-pagination";

type SalesReportsWithBranchTabsProps = {
  branches: { id: string; name: string }[];
   
  salesByBranch: { branchId: string; branchName: string; sales: any[] }[];
  filter: string;
  from?: Date;
  to?: Date;
};

export function SalesReportsWithBranchTabs({ 
  branches, 
  salesByBranch, 
  filter, 
  from, 
  to 
}: SalesReportsWithBranchTabsProps) {
  const [activeBranch, setActiveBranch] = useState(branches[0]?.id || "");
  
  // Get current branch data
  const currentBranchData = salesByBranch.find(branch => branch.branchId === activeBranch);
  const currentSales = currentBranchData?.sales || [];
  
  // Use pagination hook
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedSales,
    goToPage,
    totalItems,
    itemsPerPage,
  } = usePagination({ data: currentSales, itemsPerPage: 15 });

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sales Reports</h1>
            <p className="text-muted-foreground">Sales reports by branch</p>
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

          {salesByBranch.map(({ branchId, branchName, sales }) => (
            <TabsContent key={branchId} value={branchId}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{branchName} Sales Report</h2>
                <p className="text-sm text-muted-foreground">
                  {sales.length} sale{sales.length !== 1 ? 's' : ''} in this branch ({filter})
                </p>
              </div>
              
              <Card className="p-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Sales Report</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Summary of all sales transactions ({filter})
                    </p>
                  </div>
                  <SalesReportExport sales={sales} filter={filter} from={from} to={to} />
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableCaption>A summary of sales details.</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">ATM Payment</TableHead>
                        <TableHead className="text-right">Paytm Payment</TableHead>
                        <TableHead className="text-right">Fleet Payment</TableHead>
                        <TableHead className="text-right">XG Diesel Total</TableHead>
                        <TableHead className="text-right">HSD Diesel Total</TableHead>
                        <TableHead className="text-right">MS Petrol Total</TableHead>
                        <TableHead className="text-right">Grand Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedSales.map((sale: any) => (
                        <TableRow key={sale.id.toString()}>
                          <TableCell>
                            {new Date(sale.date).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
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
                            {formatCurrency(sale.xgDieselTotal)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(sale.hsdDieselTotal)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(sale.msPetrolTotal)}
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
                        <TableCell className="text-right font-semibold text-green-400">
                          {formatCurrency(
                            sales.reduce((sum: number, s: any) => sum + s.xgDieselTotal, 0)
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-blue-800">
                          {formatCurrency(
                            sales.reduce((sum: number, s: any) => sum + s.hsdDieselTotal, 0)
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-800">
                          {formatCurrency(
                            sales.reduce((sum: number, s: any) => sum + s.msPetrolTotal, 0)
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold text-green-800">
                          {formatCurrency(
                            sales.reduce((sum: number, s: any) => sum + s.rate, 0)
                          )}
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
