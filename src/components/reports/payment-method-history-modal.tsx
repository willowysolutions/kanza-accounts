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
  branchId,
  open,
  onOpenChange,
}: {
  paymentMethod: string;
  branchId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    
    setLoading(true);
    // Fetch sales by payment method
    const params = new URLSearchParams({
      limit: '1000', // Get all sales for this payment method
    });
    
    if (branchId) {
      params.append('branchId', branchId);
    }

    fetch(`/api/sales?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.sales) {
          // Filter by payment method and only include sales that have this payment method > 0
          const filteredSales = data.sales.filter((sale: PaymentHistoryItem) => {
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
          setHistory(filteredSales);
        }
      })
      .catch((error) => {
        console.error("Error fetching payment method history:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, paymentMethod, branchId]);

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
          <Popover>
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
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
              {dateRange?.from && dateRange?.to && (
                <div className="p-3 border-t">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => setDateRange(undefined)}
                  >
                    Clear
                  </Button>
                </div>
              )}
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
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : sortedHistory.length === 0 ? (
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

