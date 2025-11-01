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
  branchId,
  open,
  onOpenChange,
}: {
  categoryName: string;
  branchId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [history, setHistory] = useState<ExpenseHistoryItem[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    
    setLoading(true);
    // Fetch expenses by category
    const params = new URLSearchParams({
      limit: '1000', // Get all expenses for this category
    });
    
    if (branchId) {
      params.append('branchId', branchId);
    }

    fetch(`/api/expenses?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          // Filter by category name
          const filteredExpenses = data.data.filter(
            (expense: ExpenseHistoryItem) => 
              expense.category?.name === categoryName
          );
          setHistory(filteredExpenses);
        }
      })
      .catch((error) => {
        console.error("Error fetching expense history:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, categoryName, branchId]);

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
                <TableHead>Description</TableHead>
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

