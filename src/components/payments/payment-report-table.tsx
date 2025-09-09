// src/components/payment/payment-table.tsx
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
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
    customer?: { name?: string };
    supplier?: { name?: string };
  }[];
  type: "customer" | "supplier";
}) {
  const [search, setSearch] = useState("");

  const filteredRows = rows.filter((p) => {
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
          <Input
            placeholder={`Search ${type} name...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{type === "customer" ? "Customer" : "Supplier"}</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length > 0 ? (
              filteredRows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {type === "customer"
                      ? p.customer?.name ?? "N/A"
                      : p.supplier?.name ?? "N/A"}
                  </TableCell>
                  <TableCell>{p.paidAmount}</TableCell>
                  <TableCell>{p.paymentMethod}</TableCell>
                  <TableCell>{new Date(p.paidOn).toLocaleDateString()}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
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
