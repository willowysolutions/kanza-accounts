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
import { formatCurrency, formatDate } from "@/lib/utils";
import { FilterSelect } from "@/components/filters/filter-select";
import { CustomDateFilter } from "@/components/filters/custom-date-filter";
import { PurchaseReportExport } from "@/components/reports/purchase-report-export";
import { PaginationControls } from "@/components/ui/pagination-controls";

type PurchaseReportsWithBranchTabsProps = {
  branches: { id: string; name: string }[];
   
  purchasesByBranch: { branchId: string; branchName: string; purchases: any[] }[];
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
  pagination,
  currentPage // eslint-disable-line @typescript-eslint/no-unused-vars
}: PurchaseReportsWithBranchTabsProps) {
  const [activeBranch, setActiveBranch] = useState(branches[0]?.id || "");
  
  // Get current branch data
  const currentBranchData = purchasesByBranch.find(branch => branch.branchId === activeBranch);
  const currentPurchases = currentBranchData?.purchases || [];
  
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

          {purchasesByBranch.map(({ branchId, branchName, purchases }) => (
            <TabsContent key={branchId} value={branchId}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{branchName} Purchase Report</h2>
                <p className="text-sm text-muted-foreground">
                  {purchases.length} purchase{purchases.length !== 1 ? 's' : ''} in this branch ({filter})
                </p>
              </div>
              
              <Card className="p-4">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Purchase Report</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Summary of all purchase transactions ({filter})
                    </p>
                  </div>
                  <PurchaseReportExport purchases={purchases} filter={filter} from={from} to={to} />
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableCaption>A summary of purchase details.</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Purchase Price</TableHead>
                        <TableHead className="text-right">Paid Amount</TableHead>
                        <TableHead className="text-right">Pending Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPurchases.map((purchase: any) => (
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
                      ))}
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
      </div>
    </div>
  );
}
