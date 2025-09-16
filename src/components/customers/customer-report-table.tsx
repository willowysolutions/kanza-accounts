"use client";

import { useState } from "react";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import { CustomerReportExport } from "@/components/reports/customer-report-export";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  openingBalance: number;
  outstandingPayments: number;
};

export default function CustomerReportTable({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState("");

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 gap-6">
      <Card className="p-4">
        <CardHeader className="flex flex-row justify-between items-center">
          <div>
            <CardTitle>Customer Report</CardTitle>
            <p className="text-sm text-muted-foreground">
              Summary of all customer activity
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64"
            />
            <CustomerReportExport customers={filteredCustomers} />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableCaption>A summary of customer details.</TableCaption>
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
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(customer.openingBalance)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(customer.outstandingPayments)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No customers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
            <TableFooter className="bg-primary text-primary-foreground font-black">
              <TableRow>
                <TableCell className="text-right font-medium" colSpan={3}>
                  Grand Total
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(
                    filteredCustomers.reduce((sum, c) => sum + c.openingBalance, 0)
                  )}
                </TableCell>
                <TableCell className="text-right font-bold">
                  {formatCurrency(
                    filteredCustomers.reduce((sum, c) => sum + c.outstandingPayments, 0)
                  )}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
