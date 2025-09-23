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

type SupplierReportsWithBranchTabsProps = {
  branches: { id: string; name: string }[];
   
  suppliersByBranch: { branchId: string; branchName: string; suppliers: any[] }[];
};

export function SupplierReportsWithBranchTabs({ branches, suppliersByBranch }: SupplierReportsWithBranchTabsProps) {
  const [activeBranch, setActiveBranch] = useState(branches[0]?.id || "");

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Supplier Reports</h1>
            <p className="text-muted-foreground">Supplier reports by branch</p>
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

          {suppliersByBranch.map(({ branchId, branchName, suppliers }) => (
            <TabsContent key={branchId} value={branchId}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{branchName} Supplier Report</h2>
                <p className="text-sm text-muted-foreground">
                  {suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} in this branch
                </p>
              </div>
              
              <Card className="p-4">
                <CardHeader>
                  <CardTitle>Supplier Report</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Summary of all supplier accounts
                  </p>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableCaption>A summary of supplier details.</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="text-right">Opening Balance</TableHead>
                        <TableHead className="text-right">Outstanding Payments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suppliers.map((supplier: any) => (
                        <TableRow key={supplier.id.toString()}>
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>{supplier.email}</TableCell>
                          <TableCell>{supplier.phone}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(supplier.openingBalance)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(supplier.outstandingPayments)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter className="bg-primary text-primary-foreground font-black">
                      <TableRow>
                        <TableCell className="text-right font-medium" colSpan={3}>
                          Grand Total
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            suppliers.reduce((sum: number, s: any) => sum + s.openingBalance, 0)
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {formatCurrency(
                            suppliers.reduce((sum: number, s: any) => sum + s.outstandingPayments, 0)
                          )}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
