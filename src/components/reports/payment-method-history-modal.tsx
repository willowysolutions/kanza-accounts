"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { IconFileExport } from "@tabler/icons-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";

type PaymentHistoryItem = {
  id: string;
  date: string | Date;
  rate?: number;
  cashPayment?: number;
  atmPayment?: number;
  paytmPayment?: number;
  fleetPayment?: number;
  branch?: { name: string } | null;
};

export function PaymentMethodHistoryModal({
  paymentMethod,
  open,
  onOpenChange,
  sales,
  defaultFrom,
  defaultTo,
}: {
  paymentMethod: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Pre-filtered sales for this branch and current balance-sheet date range
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sales?: any[];
  defaultFrom?: Date;
  defaultTo?: Date;
}) {
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

  // Base sales list: use pre-filtered sales from balance sheet when provided
  const baseSales: PaymentHistoryItem[] = useMemo(() => {
    // If no sales passed in, just use empty list (modal will show no records)
    if (!sales || !Array.isArray(sales)) return [];
    return sales as PaymentHistoryItem[];
  }, [sales]);

  // Filter by payment method and only include rows where that method amount > 0
  const history = useMemo(() => {
    return baseSales.filter((sale: PaymentHistoryItem) => {
      switch (paymentMethod) {
        case "Cash":
          return (sale.cashPayment || 0) > 0;
        case "ATM":
          return (sale.atmPayment || 0) > 0;
        case "Paytm":
          return (sale.paytmPayment || 0) > 0;
        case "Fleet":
          return (sale.fleetPayment || 0) > 0;
        default:
          return false;
      }
    });
  }, [baseSales, paymentMethod]);

  // Filtered history based on date range
  const filteredHistory = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) {
      return history;
    }

    const startDate = new Date(dateRange.from);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateRange.to);
    endDate.setHours(23, 59, 59, 999);

    return history.filter((item) => {
      const d = new Date(item.date);
      return d >= startDate && d <= endDate;
    });
  }, [dateRange, history]);

  // Sort by date (newest first)
  const sortedHistory = useMemo(() => {
    return [...filteredHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [filteredHistory]);

  // Calculate payment amount for each sale based on payment method
  const getPaymentAmount = (sale: PaymentHistoryItem): number => {
    switch (paymentMethod) {
      case "Cash":
        return sale.cashPayment || 0;
      case "ATM":
        return sale.atmPayment || 0;
      case "Paytm":
        return sale.paytmPayment || 0;
      case "Fleet":
        return sale.fleetPayment || 0;
      default:
        return 0;
    }
  };

  const total = sortedHistory.reduce((sum, item) => sum + getPaymentAmount(item), 0);

  const handleExportPDF = () => {
    if (!sortedHistory.length) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text(`Payment Method History - ${paymentMethod}`, 40, 40);

    const tableBody = sortedHistory.map((h) => [
      format(new Date(h.date), "dd/MM/yyyy"),
      `${getPaymentAmount(h).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    ]);

    autoTable(doc, {
      startY: 70,
      head: [["Date", "Amount (INR)"]],
      body: tableBody,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      margin: { left: 40, right: 40 },
      foot: [
        [
          { content: "Total", styles: { halign: "left", fontStyle: "bold" } },
          { 
            content: `${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 
            styles: { halign: "left", fontStyle: "bold" } 
          },
        ],
      ],
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: "bold" },
    });

    const methodNameForFile = paymentMethod.replace(/\s+/g, '-');
    doc.save(`Payment-Method-History-${methodNameForFile}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Payment Method History - {paymentMethod}
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="mb-3 flex gap-3 items-center">
          {/* Date Range Picker */}
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

          {/* Export Button */}
          <Button
            onClick={handleExportPDF}
            className="bg-black text-white flex items-center gap-2 ml-auto"
            disabled={sortedHistory.length === 0}
          >
            <IconFileExport size={18} /> Export PDF
          </Button>
        </div>

        {/* History Table */}
        <div className="overflow-x-auto max-h-[60vh]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount (₹)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHistory.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    No records found.
                  </TableCell>
                </TableRow>
              ) : (
                sortedHistory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {format(new Date(item.date), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{getPaymentAmount(item).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell className="text-right font-bold">
                  Total
                </TableCell>
                <TableCell className="text-right font-bold">
                  ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}

