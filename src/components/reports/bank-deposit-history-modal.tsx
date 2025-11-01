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

type BankDepositHistoryItem = {
  id: string;
  date: string | Date;
  amount: number;
  bank?: { bankName?: string; name?: string } | null;
  branch?: { name: string } | null;
};

export function BankDepositHistoryModal({
  bankName,
  branchId,
  open,
  onOpenChange,
}: {
  bankName: string;
  branchId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [history, setHistory] = useState<BankDepositHistoryItem[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset temp date range when popover opens
  useEffect(() => {
    if (isPopoverOpen) {
      setTempDateRange(dateRange);
    }
  }, [isPopoverOpen, dateRange]);

  useEffect(() => {
    if (!open) return;
    
    setLoading(true);
    // Fetch bank deposits
    const params = new URLSearchParams({
      limit: '1000', // Get all deposits for this bank
    });
    
    if (branchId) {
      params.append('branchId', branchId);
    }

    fetch(`/api/bank-deposite?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.bankDeposite) {
          // Filter by bank name - check both bankName and name properties
          const filteredDeposits = data.bankDeposite.filter(
            (deposit: BankDepositHistoryItem) => {
              const depositBankName = deposit.bank?.bankName || deposit.bank?.name;
              return depositBankName === bankName;
            }
          );
          setHistory(filteredDeposits);
        }
      })
      .catch((error) => {
        console.error("Error fetching bank deposit history:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [open, bankName, branchId]);

  // Filtered history based on date range, then sorted by date (oldest first)
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

  // Sort by date (oldest first - chronological order like payment methods)
  const sortedHistory = useMemo(() => {
    return [...filteredHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filteredHistory]);

  const total = sortedHistory.reduce((sum, item) => sum + (item.amount || 0), 0);

  const handleExportPDF = () => {
    if (!sortedHistory.length) return;

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text(`Bank Deposit History - ${bankName}`, 40, 40);

    const tableBody = sortedHistory.map((h) => [
      format(new Date(h.date), "dd/MM/yyyy"),
      `${(h.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
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

    const bankNameForFile = bankName.replace(/\s+/g, '-');
    doc.save(`Bank-Deposit-History-${bankNameForFile}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Bank Deposit History - {bankName}
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
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
                    className="text-center text-muted-foreground"
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : sortedHistory.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={2}
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
                      ₹{(item.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
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

