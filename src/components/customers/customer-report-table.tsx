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
import { CustomerHistoryModal } from "@/components/customers/customer-history-modal";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { usePagination } from "@/hooks/use-pagination";

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

  // Use pagination hook
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedCustomers,
    goToPage,
    totalItems,
    itemsPerPage,
  } = usePagination({ data: filteredCustomers, itemsPerPage: 15 });

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
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Opening Balance</TableHead>
                <TableHead className="text-right">Outstanding Payments</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.length > 0 ? (
                paginatedCustomers.map((customer) => (
                  <CustomerRow key={customer.id} customer={customer} />
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
                <TableCell className="text-right font-medium" colSpan={2}>
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
    </div>
  );
}

function CustomerRow({ customer }: { customer: Customer }) {
  const [openHistory, setOpenHistory] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">
          <button
            className="text-blue-600 hover:underline cursor-pointer"
            onClick={() => setOpenHistory(true)}
          >
            {customer.name}
          </button>
        </TableCell>
        <TableCell>{customer.phone}</TableCell>
        <TableCell className="text-right">
          {formatCurrency(customer.openingBalance)}
        </TableCell>
        <TableCell className="text-right">
          {formatCurrency(customer.outstandingPayments)}
        </TableCell>
      </TableRow>
      
      <CustomerHistoryModal
        customerId={customer.id}
        open={openHistory}
        onOpenChange={setOpenHistory}
      />
    </>
  );
}
