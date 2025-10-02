"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useEffect } from "react";
import { CreditReportExport } from "./credit-report-export";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

interface CreditReportTableProps {
  credits: unknown[];
  branchName: string;
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
  customerFilter,
  pagination,
  currentPage,
}: CreditReportTableProps) {
  const [search, setSearch] = useState(customerFilter);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [allCredits, setAllCredits] = useState<unknown[]>(credits);
  const [loading, setLoading] = useState(false);

  // Fetch all credits when a date is selected
  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      const fetchAllCredits = async () => {
        try {
          // Use local date instead of UTC to avoid timezone issues
          const year = selectedDate.getFullYear();
          const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
          const day = String(selectedDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          const response = await fetch(`/api/credits?from=${dateStr}&to=${dateStr}&limit=1000`);
          const data = await response.json();
          setAllCredits(data.data || []);
        } catch (error) {
          console.error('Error fetching credits:', error);
          setAllCredits(credits);
        } finally {
          setLoading(false);
        }
      };
      fetchAllCredits();
    } else {
      setAllCredits(credits);
    }
  }, [selectedDate, credits]);

  // Filter credits by selected date
  const filteredByDate = useMemo(() => {
    if (!selectedDate) {
      // If no date selected, show paginated credits
      return credits;
    }
    
    // When date is selected, use allCredits (fetched from server)
    return allCredits;
  }, [credits, allCredits, selectedDate]);

  // Filter by customer name and sort by date (newest first)
  const filteredRows = filteredByDate
    .filter((credit: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const customerName = credit.customer?.name ?? "";
      return customerName.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a: any, b: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });

  // Calculate running balance for each customer
  const creditsWithBalance = useMemo(() => {
    // Group credits by customer
    const customerCredits: { [key: string]: unknown[] } = {};
    filteredRows.forEach((credit: unknown) => {
      const customerId = (credit as { customer?: { id?: string } }).customer?.id;
      if (customerId) {
        if (!customerCredits[customerId]) {
          customerCredits[customerId] = [];
        }
        customerCredits[customerId].push(credit);
      }
    });

    // Sort credits by date for each customer and calculate running balance
    const result: unknown[] = [];
    Object.values(customerCredits).forEach((customerCreditList) => {
      // Sort by date
      const sortedCredits = customerCreditList.sort((a, b) => new Date((a as { date: string }).date).getTime() - new Date((b as { date: string }).date).getTime());
      
      let runningBalance = 0;
      sortedCredits.forEach((credit) => {
        runningBalance += (credit as { amount?: number }).amount || 0;
        result.push({
          ...(credit as Record<string, unknown>),
          runningBalance: runningBalance
        });
      });
    });

    // Sort all results by date (newest first)
    return result.sort((a, b) => new Date((b as { date: string }).date).getTime() - new Date((a as { date: string }).date).getTime());
  }, [filteredRows]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{branchName} Credit Report</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[240px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              onClick={() => setSelectedDate(undefined)}
              className="w-[100px]"
            >
              Clear
            </Button>
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
            filter={selectedDate ? "custom" : "all"}
            from={selectedDate}
            to={selectedDate}
          />
        </div>

        <Table>
          <TableHeader className=" bg-blue-950">
            <TableRow>
              <TableHead className="text-white">Date</TableHead>
              <TableHead className="text-white">Customer Name</TableHead>
              <TableHead className="text-white">Credit Amount</TableHead>
              <TableHead className="text-white">Balance Due</TableHead>
              <TableHead className="text-white">Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  Loading credits for selected date...
                </TableCell>
              </TableRow>
            ) : creditsWithBalance.length > 0 ? (
              creditsWithBalance.map((credit: unknown) => (
                <TableRow key={(credit as { id: string }).id}>
                  <TableCell>
                    {new Date((credit as { date: string }).date).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit', 
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>{(credit as { customer?: { name?: string } }).customer?.name ?? "N/A"}</TableCell>
                  <TableCell>₹{((credit as { amount?: number }).amount?.toFixed(2) ?? "0.00")}</TableCell>
                  <TableCell className="font-medium">
                    ₹{((credit as { runningBalance?: number }).runningBalance?.toFixed(2) ?? "0.00")}
                  </TableCell>
                  <TableCell>{(credit as { description?: string }).description ?? "-"}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No credit records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter className="bg-primary text-primary-foreground font-black">
            <TableRow className="font-semibold">
              <TableCell colSpan={2} className="text-right">Total</TableCell>
              <TableCell>
                ₹{creditsWithBalance.reduce((sum: number, credit: unknown) => sum + ((credit as { amount?: number }).amount || 0), 0).toFixed(2)}
              </TableCell>
              <TableCell>
                ₹{creditsWithBalance.length > 0 ? 
                  ((creditsWithBalance[creditsWithBalance.length - 1] as { runningBalance?: number }).runningBalance || 0).toFixed(2) 
                  : "0.00"
                }
              </TableCell>
              <TableCell>-</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
        
        {/* Pagination - only show if pagination is available and no date filter */}
        {!selectedDate && pagination && pagination.totalCount > 0 && (
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
