"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { CreditReportExport } from "./credit-report-export";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CreditReportTableProps {
  credits: unknown[];
  branchName: string;
  filter: string;
  from?: Date;
  to?: Date;
  customerFilter: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
  currentPage: number;
}

export function CreditReportTable({
  credits,
  branchName,
  filter,
  from,
  to,
  customerFilter,
  pagination,
  currentPage,
}: CreditReportTableProps) {
  const [search, setSearch] = useState(customerFilter);
  const [dateFilter, setDateFilter] = useState(filter);

  // Filter credits by date range
  const filteredByDate = useMemo(() => {
    const now = new Date();
    return credits.filter((credit: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const creditDate = new Date(credit.date);
      switch (dateFilter) {
        case "today":
          return creditDate.toDateString() === now.toDateString();
        case "yesterday": {
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          return creditDate.toDateString() === yesterday.toDateString();
        }
        case "week": {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return creditDate >= startOfWeek;
        }
        case "month":
          return (
            creditDate.getMonth() === now.getMonth() &&
            creditDate.getFullYear() === now.getFullYear()
          );
        case "year":
          return creditDate.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  }, [credits, dateFilter]);

  // Filter by customer name
  const filteredRows = filteredByDate.filter((credit: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const customerName = credit.customer?.name ?? "";
    return customerName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{branchName} Credit Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Search customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <CreditReportExport 
            credits={filteredRows} 
            branchName={branchName}
            filter={dateFilter}
            from={from}
            to={to}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Credit Amount</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length > 0 ? (
              filteredRows.map((credit: any) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                <TableRow key={credit.id}>
                  <TableCell>
                    {new Date(credit.date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>{credit.customer?.name ?? "N/A"}</TableCell>
                  <TableCell>₹{credit.amount?.toFixed(2) ?? "0.00"}</TableCell>
                  <TableCell>{credit.description ?? "-"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center">
                  No credit records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * (pagination.limit || 50)) + 1} to {Math.min(currentPage * (pagination.limit || 50), pagination.totalCount)} of {pagination.totalCount} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('page', (currentPage - 1).toString());
                  window.location.href = url.toString();
                }}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center space-x-1">
                <span className="text-sm">
                  Page {currentPage} of {pagination.totalPages}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('page', (currentPage + 1).toString());
                  window.location.href = url.toString();
                }}
                disabled={!pagination.hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
