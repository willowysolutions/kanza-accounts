// src/components/payment/payment-table.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PaymentReportExport } from "@/components/reports/payment-report-export";
import { useState } from "react";

export default function PaymentTable({
  rows,
  type,
}: {
  rows: {
    id: string | number;
    paidAmount: number;
    paymentMethod: string;
    paidOn: string | Date;
    creditGiven?: number;
    customer?: { name?: string; outstandingPayments?: number };
    supplier?: { name?: string; outstandingPayments?: number };
  }[];
  type: "customer" | "supplier";
}) {
  const [search, setSearch] = useState("");

  // Remove duplicates and filter
  const uniqueRows = rows.filter((payment, index, self) => 
    index === self.findIndex(p => p.id === payment.id)
  );
  
  const filteredRows = uniqueRows.filter((p) => {
    const name =
      type === "customer" ? p.customer?.name ?? "" : p.supplier?.name ?? "";
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {type === "customer" ? "Customer" : "Supplier"} Payment History
          </h2>
          <div className="flex items-center gap-3">
            <Input
              placeholder={`Search ${type} name...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <PaymentReportExport rows={filteredRows} type={type} />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>{type === "customer" ? "Customer" : "Supplier"}</TableHead>
              <TableHead>Amount Received</TableHead>
              <TableHead>Outstanding Payments</TableHead>
              <TableHead>Method</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length > 0 ? (
              filteredRows.map((p, index) => (
                <TableRow key={`${p.id}-${index}`}>
                  <TableCell>
                    {new Date(p.paidOn).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    {type === "customer"
                      ? p.customer?.name ?? "N/A"
                      : p.supplier?.name ?? "N/A"}
                  </TableCell>
                  <TableCell>{p.paidAmount}</TableCell>
                  <TableCell>
                    {type === "customer"
                      ? p.customer?.outstandingPayments ?? 0
                      : p.supplier?.outstandingPayments ?? 0}
                  </TableCell>
                  <TableCell>{p.paymentMethod}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No {type} payments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
