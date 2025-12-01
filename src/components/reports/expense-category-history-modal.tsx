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

type ExpenseHistoryItem = {
  id: string;
  date: string | Date;
  description: string | null;
  amount: number;
  category?: { name: string } | null;
  branch?: { name: string } | null;
};

export function ExpenseCategoryHistoryModal({
  categoryName,
  open,
  onOpenChange,
  defaultFrom,
  defaultTo,
  expenses,
}: {
  categoryName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFrom?: Date;
  defaultTo?: Date;
  // Pre-filtered expenses for this branch and current balance-sheet date range
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expenses?: any[];
}) {
  const [history, setHistory] = useState<ExpenseHistoryItem[]>([]);
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

  // Base expenses list: use pre-filtered expenses from balance sheet when provided
  useEffect(() => {
    if (!open) return;

    if (expenses && Array.isArray(expenses)) {
      const filtered = (expenses as ExpenseHistoryItem[]).filter(
        (expense) => expense.category?.name === categoryName
      );
      setHistory(filtered);
    } else {
      setHistory([]);
    }
  }, [open, expenses, categoryName]);

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

  const total = sortedHistory.reduce((sum, item) => sum + (item.amount || 0), 0);

  const handleExportPDF = () => {
    if (!sortedHistory.length) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text(`Expense Category History - ${categoryName}`, 40, 40);

    autoTable(doc, {
      startY: 70,
      head: [["Date", "Description", "Amount (INR)"]],
      body: sortedHistory.map((h) => [
        format(new Date(h.date), "dd/MM/yyyy"),
        h.description || "-",
        `${(h.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      ]),
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      margin: { left: 40, right: 40 },
      foot: [
        [
          { content: "Total", colSpan: 2, styles: { halign: "right", fontStyle: "bold" } },
          { 
            content: `${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 
            styles: { halign: "right", fontStyle: "bold" } 
          },
        ],
      ],
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: "bold" },
    });

    const categoryNameForFile = categoryName.replace(/\s+/g, '-');
    doc.save(`Expense-Category-History-${categoryNameForFile}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Expense Category History - {categoryName}
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
                <TableHead>Description</TableHead>
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
                    <TableCell>{item.description || "-"}</TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell colSpan={2} className="text-right font-bold">
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

