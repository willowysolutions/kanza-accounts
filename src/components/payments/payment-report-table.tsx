// src/components/payment/payment-table.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { PaymentReportExport } from "@/components/reports/payment-report-export";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { useState } from "react";

export default function PaymentTable({
  rows,
  type,
  pagination,
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
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
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

  // Server-side pagination navigation
  const goToPage = (page: number) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', page.toString());
    window.location.href = url.toString();
  };

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
          <TableHeader className=" bg-blue-950">
            <TableRow>
              <TableHead className="text-white">Date</TableHead>
              <TableHead className="text-white">{type === "customer" ? "Customer" : "Supplier"}</TableHead>
              <TableHead className="text-white">Amount Received</TableHead>
              <TableHead className="text-white">Outstanding Payments</TableHead>
              <TableHead className="text-white">Method</TableHead>
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
          <TableFooter className="bg-primary text-primary-foreground font-black">
            <TableRow className="font-semibold">
              <TableCell colSpan={2} className="text-right">Total</TableCell>
              <TableCell>
                ₹{filteredRows.reduce((sum, p) => sum + p.paidAmount, 0).toLocaleString()}
              </TableCell>
              <TableCell>
                ₹{filteredRows.reduce((sum, p) => {
                  const outstanding = type === "customer" 
                    ? p.customer?.outstandingPayments ?? 0 
                    : p.supplier?.outstandingPayments ?? 0;
                  return sum + outstanding;
                }, 0).toLocaleString()}
              </TableCell>
              <TableCell>-</TableCell>
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
  );
}
