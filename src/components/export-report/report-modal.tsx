"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "../ui/button";
import { IconFileExport } from "@tabler/icons-react";

type ReportModalProps = {
  date?: Date;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ReportData = {
  date: string;
  branchName: string;
  totals: {
    totalPurchase: number;
    totalSale: number;
    totalExpense: number;
    totalCredit: number;
    salesAndExpense: number;
    totalBalanceReceipt: number;
    salesAndBalaceReceipt: number;
    expenseSum: number;
    cashBalance: number;
  };
  purchases: { id: string; purchasePrice: number }[];
  sales: {
    id: string;
    atmPayment: number;
    paytmPayment: number;
    fleetPayment: number;
    rate: number;
  }[];
  expenses: { id: string; category: { name: string }; amount: number }[];
  credits: {
    id: string;
    description: string;
    amount: number;
    customer: { id: string; name: string };
  }[];
  oils: { id: string; amount: number; productType: string; quantity: number; price: number }[];
  bankDeposite: { id: string; amount: number; bank: { id: string; bankName: string } }[];
  creditRecieved: { id: string; amount: number; customer: { id: string; name: string }; paidOn: Date }[];
  customerPayments: { id: string; amount: number; customer: { id: string; name: string }; paidOn: Date }[];
  meterReadings: {
    id: string;
    openingReading: number;
    closingReading: number;
    difference: number;
    fuelRate: number;
    totalAmount: number;
    sale: number;
    nozzle: { nozzleNumber: string; fuelType: string };
    machine: { name: string };
  }[];
};

export function ReportModal({ date, open, onOpenChange }: ReportModalProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    if (!open || !date) return;
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/${date}`);
        const data = await res.json();
        setReport(data);
      } catch (err) {
        console.error("Report fetch error", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [open, date]);

const handleExportPDF = () => {
  if (!report) return;

  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

const pageWidth = doc.internal.pageSize.getWidth();
const marginX = 40;   // same as autoTable margin.left/right
const headerHeight = 40;

// Yellow header bar (aligned with table)
doc.setFillColor(253, 224, 71);
doc.rect(marginX, 30, pageWidth - marginX * 2, headerHeight, "F");

// Title (centered within table width)
doc.setFontSize(14);
doc.setFont("helvetica", "bold");
doc.text("IBP AUTO SERVICES", pageWidth / 2, 50, { align: "center" });

// Subtitle
doc.setFontSize(12);
doc.setFont("helvetica", "normal");
doc.text(report.branchName || "COCO KONDOTTY", pageWidth / 2, 65, { align: "center" });

// Date (right aligned with table edge)
doc.setFontSize(11);
doc.text(`${date && formatDate(date)}`, pageWidth - marginX, 50, {
  align: "right",
});

const startY = 90;
const body: (object | string | number)[][] = [];

// --- Table header ---
body.push([
  { content: "PRODUCT", styles: { halign: "center", fillColor: [253, 224, 71], fontStyle: "bold" } },
  { content: "OP.READING", styles: { halign: "center", fillColor: [253, 224, 71], fontStyle: "bold" } },
  { content: "CL.READING", styles: { halign: "center", fillColor: [253, 224, 71], fontStyle: "bold" } },
  { content: "SALE", styles: { halign: "center", fillColor: [253, 224, 71], fontStyle: "bold" } },
  { content: "RATE", styles: { halign: "center", fillColor: [253, 224, 71], fontStyle: "bold" } },
  { content: "AMOUNT", styles: { halign: "center", fillColor: [253, 224, 71], fontStyle: "bold" } },
]);

body.push([
    { content: "", colSpan: 6, styles: { minCellHeight: 5 } },
  ]);

// --- Group readings by fuelType ---
const grouped = report.meterReadings.reduce((acc, m) => {
  const fuel = m.nozzle?.fuelType || "Other";
  if (!acc[fuel]) acc[fuel] = [];
  acc[fuel].push(m);
  return acc;
}, {} as Record<string, typeof report.meterReadings>);

// --- Rows ---
Object.entries(grouped).forEach(([fuelType, readings]) => {
  readings.forEach((m, idx) => {
    body.push([
      // PRODUCT column (fuel type) only on the first row
      idx === 0
        ? { content: fuelType, styles: { fillColor: [253, 224, 71], fontStyle: "bold" } }
        : "",

      // ✅ Always show opening/closing readings etc. for each row
      m.openingReading,
      m.closingReading,
      m.difference,
      m.fuelRate,
      m.totalAmount,
    ]);
  });

  // (optional) subtotal row like your screenshot
const total = Math.round(
  readings.reduce(
    (sum, r) => sum + (r.fuelRate || 0) * (r.sale || 0),
    0
  )
);

body.push([
  { content: "", colSpan: 4 },
  { 
    content: "Total", 
    styles: { 
      halign: "center", 
      fontSize: 10, 
      fillColor: [253, 224, 71], 
      fontStyle: "bold", 
      textColor: [0, 0, 0] 
    } 
  },
  { 
    content: total, 
    styles: { 
      halign: "center", 
      fillColor: [253, 224, 71], 
      fontStyle: "bold", 
      fontSize: 10, 
      textColor: [0, 0, 0] 
    } 
  },
]);


   body.push([
    { content: "", colSpan: 6, styles: { minCellHeight: 10 } },
  ]);
});

// --- Oils section ---
if (report.oils.length > 0) {
  report.oils.forEach((o) => {
    if (o.productType.toUpperCase() === "2T-OIL") {
      // ✅ Special style for 2T OIL
      body.push([
        { content: o.productType, styles: { fillColor: [255, 0, 0], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" } },
        "",
        "",
        o.quantity,
        "",
        o.price,
      ]);
    } else {
      // Normal oil rows
      body.push([o.productType, "", "", o.quantity, o.amount, o.price]);
    }
  });
} else {
  body.push(["Nil", "", "", 0, "", 0]);
}


  // --- Grand Total row ---
  body.push([
    { content: "GRAND TOTAL", colSpan: 5, styles: { halign: "center", fontStyle: "bold" } },
    { content: report.totals.totalSale, styles: { halign: "center", fillColor: [253, 224, 71], fontStyle: "bold" , fontSize: 10,} },
  ]);

  body.push([
    { content: "", colSpan: 6, styles: { minCellHeight: 10 } },
  ]);

  // --- Receipts & Expenses ---
  type TableCellData = { content: string | number; colSpan?: number; styles?: Record<string, unknown> };
  type TableRowData = [TableCellData, string | number | TableCellData];

  const receiptRows: TableRowData[] = [
    [{ content: "SALE", colSpan: 2, styles: { halign: "center", underline: true, fontStyle: "bold" } }, report.totals.totalSale],
    [{ content: "BALANCE RECEIPT", colSpan: 2 , styles: { halign: "center", underline: true, fontStyle: "bold" }}, report.totals.totalBalanceReceipt],
    // Customer Payments
    ...report.customerPayments.map((cp) => [
      { content: cp.customer.name, colSpan: 2, styles: { halign: "center", underline: true, fontStyle: "bold" } },
      cp.amount
    ] as TableRowData),
    [{ content: "", colSpan: 2 },{content: report.totals.salesAndBalaceReceipt, styles: { fillColor: [253, 224, 71]}}],
    [{ content: "EXPENSES", colSpan: 2, styles: { halign: "center", underline: true, fontStyle: "bold" } }, report.totals.expenseSum.toFixed(2)],
    [{ content: "BANK DEPOSITES", colSpan: 2, styles: { halign: "center", underline: true, fontStyle: "bold" } }, ""],
    ...report.bankDeposite.map((b) => [{ content: b.bank.bankName, colSpan: 2 }, b.amount] as TableRowData),
    [{ content: "CASH BALANCE", colSpan: 2, styles: { halign: "center", underline: true, fontStyle: "bold" } },
     { content: report.totals.cashBalance.toFixed(2), styles: { fillColor: [253, 224, 71], fontStyle: "bold" } } ],
  ];

  const expenseRows: TableRowData[] = [
    // Payments
    ...report.sales.map((s) => [{ content: "ATM", colSpan: 2, styles: { fontStyle: "bold" } }, s.atmPayment] as TableRowData),
    ...report.sales.map((s) => [{ content: "PAYTM", colSpan: 2, styles: { fontStyle: "bold" } }, s.paytmPayment] as TableRowData),
    ...report.sales.map((s) => [{ content: "FLEET", colSpan: 2, styles: { fontStyle: "bold" } }, s.fleetPayment] as TableRowData),
    // Expenses
    ...report.credits.map((c) => [{ content: c.customer?.name, colSpan: 2, styles: { fontStyle: "bold" } }, c.amount] as TableRowData),
    ...report.expenses.map((e) => [{ content: e.category.name, colSpan: 2, styles: { fontStyle: "bold" } }, e.amount] as TableRowData),
    [
      { content: "EXPENSES TOTAL", colSpan: 2, styles: { fontStyle: "bold" } },
      { content: report.totals.expenseSum.toFixed(2), styles: { fillColor: [253, 224, 71], fontStyle: "bold" } },
    ] as TableRowData,
  ];

  // Balance rows
  const maxLength = Math.max(receiptRows.length, expenseRows.length);
  while (expenseRows.length < maxLength) expenseRows.push([{ content: "", colSpan: 2 }, ""]);
  while (receiptRows.length < maxLength) receiptRows.push([{ content: "", colSpan: 2 }, ""]);

  // --- Section Header ---
  body.push([
    { content: "EXPENSES", colSpan: 2, styles: { halign: "center", fillColor: [253, 224, 71], fontStyle: "bold" } },
    { content: "AMOUNT", styles: { halign: "center", fillColor: [253, 224, 71], fontStyle: "bold" } },
    { content: "RECEIPT", colSpan: 2, styles: { halign: "center", fillColor: [253, 224, 71], fontStyle: "bold" } },
    { content: "AMOUNT", styles: { halign: "center", fillColor: [253, 224, 71], fontStyle: "bold" } },

  ]);

  // Merge rows
  for (let i = 0; i < maxLength; i++) {
    body.push([ ...expenseRows[i], ...receiptRows[i]]);
  }

  // --- Single autoTable ---
  autoTable(doc, {
  startY,
  body,
  theme: "grid",
  styles: { fontSize: 9, cellPadding: 3 },
  tableWidth: pageWidth - marginX * 2, // ✅ match header width
  margin: { left: marginX, right: marginX },
  columnStyles: {
    0: { halign: "center" },
    1: { halign: "center", fontStyle: "bold" },
    2: { halign: "center", fontStyle: "bold" },
    3: { halign: "center", fontStyle: "bold" },
    4: { halign: "center", fontStyle: "bold" },
    5: { halign: "center", fontStyle: "bold" },
  },
});

  doc.save(`Daily-Report-${date && formatDate(date)}.pdf`);
};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="top"
        className="w-full overflow-y-scroll max-h-screen p-5"
      >
        <SheetHeader className="mb-4">
          <SheetTitle>Daily Report - {date && formatDate(date)}</SheetTitle>
          <SheetDescription>Complete daily transaction summary.</SheetDescription>
        </SheetHeader>
        {loading && <div className="p-4 text-center">Loading...</div>}

        {report && (
          <div className="space-y-6 overflow-x-auto">
            {/* Products / Meter Readings */}
            <Table>
              <TableHeader>
                <TableRow className="bg-yellow-200">
                  <TableHead>NOZZLE</TableHead>
                  <TableHead className="text-right">OP.READING </TableHead>
                  <TableHead className="text-right">CL.READING </TableHead>
                  <TableHead className="text-right">SALE</TableHead>
                  <TableHead className="text-right">RATE</TableHead>
                  <TableHead className="text-right">AMOUNT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.meterReadings.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>{`${m.nozzle?.nozzleNumber}`}</TableCell>
                    <TableCell className="text-right">{m.openingReading}</TableCell>
                    <TableCell className="text-right">{m.closingReading}</TableCell>
                    <TableCell className="text-right">{m.difference}</TableCell>
                    <TableCell className="text-right">{m.fuelRate}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(m.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Oils */}
            <Table>
              <TableHeader>
                <TableRow className="bg-yellow-200">
                  <TableHead>OIL</TableHead>
                  <TableHead>QUANTITY</TableHead>
                  <TableHead className="text-right">AMOUNT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.oils.length > 0 ? (
                  report.oils.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>{o.productType}</TableCell>
                      <TableCell>{o.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(o.price)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell>Nil</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell className="text-right">{formatCurrency(0)}</TableCell>
                  </TableRow>
                )}
                <TableRow className="font-bold border-t">
                  <TableCell colSpan={2}>TOTAL SALE</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(report.totals.totalSale)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>

            {/* Receipts & Expenses */}
            <div className="grid grid-cols-2 gap-6">
              {/* Expenses */}
              <Table>
                <TableHeader>
                  <TableRow className="bg-yellow-200">
                    <TableHead>EXPENSES</TableHead>
                    <TableHead className="text-right">AMOUNT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.sales.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>ATM</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(e.atmPayment)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {report.sales.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>PAYTM</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(e.paytmPayment)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {report.sales.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>FLEET</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(e.fleetPayment)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t">
                    <TableCell>CREDITORS</TableCell>
                    <TableCell />
                  </TableRow>
                  {report.credits.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.customer.name}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(c.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t">
                    <TableCell>EXPENSES</TableCell>
                    <TableCell />
                  </TableRow>
                  {report.expenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.category.name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(e.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t">
                    <TableCell />
                    <TableCell className="text-right bg-yellow-200">
                      {formatCurrency(report.totals.expenseSum)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Receipts */}
              <Table>
                <TableHeader>
                  <TableRow className="bg-yellow-200">
                    <TableHead>RECEIPT</TableHead>
                    <TableHead className="text-right">AMOUNT</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.sales.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>Sale</TableCell>
                      <TableCell className="text-right">{formatCurrency(s.rate)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell>Balance Receipt</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(report.totals.totalBalanceReceipt)}
                    </TableCell>
                  </TableRow>
                  {/* Customer Payments */}
                  {report.customerPayments.map((cp) => (
                    <TableRow key={cp.id}>
                      <TableCell>{cp.customer.name}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(cp.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t">
                    <TableCell />
                    <TableCell className="text-right bg-yellow-200">
                      {formatCurrency(report.totals.salesAndBalaceReceipt)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Expenses</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(report.totals.expenseSum)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="font-bold border-t">
                    <TableCell>BANK DEPOSITS</TableCell>
                    <TableCell />
                  </TableRow>
                  {report.bankDeposite.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.bank.bankName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(b.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t">
                    <TableCell>Cash Balance</TableCell>
                    <TableCell className="text-right bg-yellow-200">
                      {formatCurrency(report.totals.cashBalance)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              
            </div>
          </div>
        )}
        <SheetFooter className="mt-4 flex justify-end gap-2">
          <div className="mt-4 flex justify-end gap-2">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                Close
              </Button>
            </SheetClose>
            <Button onClick={handleExportPDF} className="bg-black text-white">
              <IconFileExport /> Export PDF
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
