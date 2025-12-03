"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { IconFileExport } from "@tabler/icons-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";

type HistoryItem = {
  id: string;
  customer: string;
  type: "credit" | "payment";
  amount: number;
  method?: string;
  date: string;
  fuelType?: string;
  quantity?: number;
};

type CustomerData = {
  id: string;
  name: string;
  openingBalance: number;
  outstandingPayments: number;
};

export function CustomerHistoryModal({
  customerId,
  open,
  onOpenChange,
  defaultFrom,
  defaultTo,
}: {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFrom?: Date;
  defaultTo?: Date;
}) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [filter, setFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  // Reset temp date range when popover opens
  useEffect(() => {
    if (isPopoverOpen) {
      setTempDateRange(dateRange);
    }
  }, [isPopoverOpen, dateRange]);

  // Initialize date range from defaults (e.g. selected month in balance sheet)
  useEffect(() => {
    if (!open || !defaultFrom || !defaultTo) return;
    const range: DateRange = { from: new Date(defaultFrom), to: new Date(defaultTo) };
    setDateRange(range);
    setTempDateRange(range);
  }, [open, defaultFrom, defaultTo]);

  useEffect(() => {
    if (!open) return;
    fetch(`/api/customers/${customerId}/history/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.history) {
          setHistory(data.history);
        }
        if (data.customer) {
          setCustomer(data.customer);
        }
      });
  }, [open, customerId]);

  // Filtered history based on select filter and selected date
  const filteredHistory = useMemo(() => {
    const now = new Date();
    return history.filter((item) => {
      const d = new Date(item.date);

      // Apply select filter
      let selectFilterPass = true;
      switch (filter) {
        case "today":
          selectFilterPass = d.toDateString() === now.toDateString();
          break;
        case "yesterday": {
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          selectFilterPass = d.toDateString() === yesterday.toDateString();
          break;
        }
        case "week": {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          selectFilterPass = d >= startOfWeek;
          break;
        }
        case "month":
          selectFilterPass =
            d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
          break;
        case "year":
          selectFilterPass = d.getFullYear() === now.getFullYear();
          break;
      }

      // Apply date range filter
      let dateFilterPass = true;
      if (dateRange?.from && dateRange?.to) {
        const startDate = new Date(dateRange.from);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        dateFilterPass = d >= startDate && d <= endDate;
      }

      return selectFilterPass && dateFilterPass;
    });
  }, [filter, dateRange, history]);

  // Calculate opening balance based on date range (same logic as balance sheet)
  const calculatedOpeningBalance = useMemo(() => {
    if (!customer) return 0;
    
    // Determine the start date for calculation
    let startDate: Date | undefined;
    
    if (dateRange?.from) {
      // Use the date range start
      startDate = new Date(dateRange.from);
      startDate.setHours(0, 0, 0, 0);
    } else if (defaultFrom) {
      // Use defaultFrom if provided
      startDate = new Date(defaultFrom);
      startDate.setHours(0, 0, 0, 0);
    }
    
    // If no start date, use base opening balance
    if (!startDate) {
      return customer.openingBalance || 0;
    }
    
    // Calculate credits and payments before the start date
    // Use ALL history items (not filtered) to calculate opening balance
    const creditsBeforeStart = history
      .filter((item) => {
        if (item.type !== "credit") return false;
        const itemDate = new Date(item.date);
        return itemDate < startDate!;
      })
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    const paymentsBeforeStart = history
      .filter((item) => {
        if (item.type !== "payment") return false;
        const itemDate = new Date(item.date);
        return itemDate < startDate!;
      })
      .reduce((sum, item) => sum + (item.amount || 0), 0);
    
    // Opening balance = base opening + credits before start - payments before start
    return (customer.openingBalance || 0) + creditsBeforeStart - paymentsBeforeStart;
  }, [customer, history, dateRange, defaultFrom]);

  // Sort by date and calculate running balance starting from calculated opening balance
  const historyWithBalance = useMemo(() => {
    const sorted = [...filteredHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    // Start with calculated opening balance
    let runningBalance = calculatedOpeningBalance;
    return sorted.map((item) => {
      if (item.type === "credit") {
        // Credit increases the balance (customer owes more)
        runningBalance += item.amount;
      } else {
        // Payment decreases the balance (customer pays off debt)
        runningBalance -= item.amount;
      }
      return { ...item, balance: runningBalance };
    });
  }, [filteredHistory, calculatedOpeningBalance]);

  // Total should be the final balance after all transactions in the filtered period
  // This matches the logic: month 1st pending = next month opening balance
  const total = historyWithBalance.length > 0 
    ? historyWithBalance[historyWithBalance.length - 1].balance 
    : calculatedOpeningBalance;

  const customerName = customer?.name || history[0]?.customer;

  const handleExportPDF = () => {
    if (!historyWithBalance.length) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text(`Customer Statement - ${customerName || "Unknown"}`, 40, 40);

    autoTable(doc, {
      startY: 70,
      head: [["Date", "Opening Balance", "Fuel Type", "Quantity", "Debit", "Credit", "Balance"]],
      body: historyWithBalance.map((h) => {
        // Show the same calculated opening balance for ALL transactions in the selected period
        return [
          new Date(h.date).toLocaleDateString(),
          `${calculatedOpeningBalance.toLocaleString()}`,
          h.fuelType || "-",
          h.quantity || "-",
          h.type === "credit" ? `${h.amount.toLocaleString()}` : "-",
          h.type === "payment" ? `${h.amount.toLocaleString()}` : "-",
          `${h.balance.toLocaleString()}`,
        ];
      }),
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      margin: { left: 40, right: 40 },
      foot: [
        [
          { content: "Final Total", colSpan: 6, styles: { halign: "right" } },
          { content: `${total.toLocaleString()}`, styles: { halign: "right" } },
        ],
      ],
    });

    doc.save(`Customer-Statement-${customerName || "Unknown"}.pdf`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="top" className="w-full overflow-y-auto max-h-screen p-6">
        <SheetHeader className="mb-4">
          <SheetTitle>
            Customer Statement {customerName && ` - ${customerName}`}
          </SheetTitle>
          <SheetDescription>
            View transaction history and balance details for this customer
          </SheetDescription>
        </SheetHeader>

        {/* Filters */}
        <div className="mb-3 flex gap-3 items-center">
          {/* Select filter */}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="bg-white">
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

          {/* Date range picker filter */}
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 bg-white">
                <CalendarIcon className="h-4 w-4" />
                {dateRange?.from && dateRange?.to
                  ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                  : "Pick date range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={tempDateRange || dateRange}
                onSelect={setTempDateRange}
                numberOfMonths={2}
              />
              <div className="p-3 border-t flex gap-2">
                {(tempDateRange?.from && tempDateRange?.to) || (dateRange?.from && dateRange?.to) ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setTempDateRange(undefined);
                        setDateRange(undefined);
                        setIsPopoverOpen(false);
                      }}
                    >
                      Clear
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setDateRange(tempDateRange);
                        setIsPopoverOpen(false);
                      }}
                      disabled={!tempDateRange?.from || !tempDateRange?.to}
                    >
                      Apply
                    </Button>
                  </>
                ) : null}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Statement Table */}
        <div className="overflow-x-auto max-h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Fuel Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Opening Balance</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyWithBalance.length === 0 && !customer && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    No records found.
                  </TableCell>
                </TableRow>
              )}
              {historyWithBalance.map((item) => {
                // Show the same calculated opening balance for ALL transactions in the selected period
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      {new Date(item.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{item.fuelType ?? "-"}</TableCell>
                    <TableCell>{item.quantity ?? "-"}</TableCell>
                    <TableCell>
                      ₹{calculatedOpeningBalance.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-red-600">
                      {item.type === "credit" ? `₹${item.amount.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      {item.type === "payment" ? `₹${item.amount.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{item.balance.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell colSpan={6} className="text-right font-bold">
                  Pending Total
                </TableCell>
                <TableCell className="text-right font-bold">
                  ₹{total.toLocaleString()}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleExportPDF}
            className="bg-black text-white flex items-center gap-2"
          >
            <IconFileExport size={18} /> Export PDF
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
