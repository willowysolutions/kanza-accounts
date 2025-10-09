"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function CustomerHistoryModal({
  customerId,
  open,
  onOpenChange,
}: {
  customerId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState("all");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  useEffect(() => {
    if (!open) return;
    fetch(`/api/customers/${customerId}/history/`)
      .then((res) => res.json())
      .then((data) => {
        if (data.history) {
          setHistory(data.history);
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

      // Apply date picker filter
      let dateFilterPass = true;
      if (selectedDate) {
        dateFilterPass = d.toDateString() === selectedDate.toDateString();
      }

      return selectFilterPass && dateFilterPass;
    });
  }, [filter, selectedDate, history]);

  // Sort by date and calculate running balance
  const historyWithBalance = useMemo(() => {
    const sorted = [...filteredHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let runningBalance = 0;
    return sorted.map((item) => {
      if (item.type === "credit") {
        runningBalance -= item.amount;
      } else {
        runningBalance += item.amount;
      }
      return { ...item, balance: runningBalance };
    });
  }, [filteredHistory]);

  const total =
    historyWithBalance.length > 0
      ? historyWithBalance[historyWithBalance.length - 1].balance
      : 0;

  const customerName = history[0]?.customer;

  const handleExportPDF = () => {
    if (!historyWithBalance.length) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text(`Customer Statement - ${customerName || "Unknown"}`, 40, 40);

    autoTable(doc, {
      startY: 70,
      head: [["Date", "Fuel Type", "Quantity", "Debit", "Credit", "Balance"]],
      body: historyWithBalance.map((h) => [
        new Date(h.date).toLocaleDateString(),
        h.fuelType || "-",
        h.quantity || "-",
        h.type === "credit" ? `${h.amount}` : "-",
        h.type === "payment" ? `${h.amount}` : "-",
        `${h.balance.toLocaleString()}`,
      ]),
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      margin: { left: 40, right: 40 },
      foot: [
        [
          { content: "Final Total", colSpan: 5, styles: { halign: "right" } },
          { content: `${total.toLocaleString()}`, styles: { halign: "right" } },
        ],
      ],
    });

    doc.save(`Customer-Statement-${customerName || "Unknown"}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Customer Statement {customerName && ` - ${customerName}`}
          </DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="mb-3 flex gap-3 items-center">
          {/* Select filter */}
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger>
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

          {/* Date picker filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                {selectedDate
                  ? selectedDate.toLocaleDateString()
                  : "Select Date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
              />
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() => setSelectedDate(undefined)}
                >
                  Clear
                </Button>
              )}
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
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyWithBalance.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No records found.
                  </TableCell>
                </TableRow>
              )}
              {historyWithBalance.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {new Date(item.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{item.fuelType ?? "-"}</TableCell>
                  <TableCell>{item.quantity ?? "-"}</TableCell>
                  <TableCell className="text-right text-red-600">
                    {item.type === "credit" ? `₹${item.amount}` : "-"}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {item.type === "payment" ? `₹${item.amount}` : "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{item.balance.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>

            <TableFooter>
              <TableRow>
                <TableCell colSpan={5} className="text-right font-bold">
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
      </DialogContent>
    </Dialog>
  );
}
