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
  type: "credit" | "payment"; // credit = debit, payment = credit
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

  // Filter by date range
  const filteredHistory = useMemo(() => {
    const now = new Date();
    return history.filter((item) => {
      const d = new Date(item.date);
      switch (filter) {
        case "today":
          return d.toDateString() === now.toDateString();
        case "yesterday": {
          const yesterday = new Date();
          yesterday.setDate(now.getDate() - 1);
          return d.toDateString() === yesterday.toDateString();
        }
        case "week": {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return d >= startOfWeek;
        }
        case "month":
          return (
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
          );
        case "year":
          return d.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  }, [filter, history]);

  // Sort by date (oldest first) and calculate running balance
  const historyWithBalance = useMemo(() => {
    const sorted = [...filteredHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let runningBalance = 0;
    return sorted.map((item) => {
      if (item.type === "credit") {
        runningBalance += item.amount; // debit increases balance
      } else {
        runningBalance -= item.amount; // payment decreases balance
      }
      return { ...item, balance: runningBalance };
    });
  }, [filteredHistory]);

  // Final total = last balance
  const total =
    historyWithBalance.length > 0
      ? historyWithBalance[historyWithBalance.length - 1].balance
      : 0;

  // Get customer name from the first history item, if available
  const customerName = history[0]?.customer;

  // Export PDF
  const handleExportPDF = () => {
    if (!historyWithBalance.length) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text(
      `Customer Statement - ${customerName || "Unknown"}`,
      40,
      40
    );

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

        {/* Filter */}
        <div className="mb-3">
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
                  <TableCell className="text-right text-red-500">
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
