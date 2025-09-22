'use client';

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Eye, Download } from "lucide-react";
import { Button } from "../ui/button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Sales } from "@/types/sales";
import { ReportModal } from "./report-modal";



export const reportColumns: ColumnDef<Sales>[] = [
  {
    accessorKey: "date",
    header: "Date & Time",
    cell:({row}) => {
      const dateTime = row.original.date
      return (
        <div>{formatDate(dateTime)}</div>
      )
    }
  },
  {
    accessorKey: "branchId",
    header: "Branch",
    cell: ({ row }) => {
      const branch = row.original.branch.name;
      return <div>{branch ? String(branch) : "..."}</div>;
    },
  },
  {
    accessorKey:"cashPayment",
    header:"Cash Payment"
  },
  {
    accessorKey:"atmPayment",
    header:"ATM Payment"
  },
  {
    accessorKey:"paytmPayment",
    header:"Paytm Payment"
  },
  {
    accessorKey:"fleetPayment",
    header:"Fleet Payment"
  },
  {
    accessorKey:"hsdDieselTotal",
    header:"HSD-DIESEL",
    cell: ({row}) => {
      const hsdDieselTotal = row.original.hsdDieselTotal
      return (
        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium bg-blue-100 text-blue-800`}>
        {formatCurrency(hsdDieselTotal)}
        </div>
      )
    }
  },
  {
    accessorKey:"xzDieselTotal",
    header:"XZ-DIESEL",
    cell: ({row}) => {
      const xzDieselTotal = row.original.xgDieselTotal
      return (
        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium bg-blue-100 text-blue-800`}>
        {formatCurrency(xzDieselTotal)}
        </div>
      )
    }
  },
  {
    accessorKey:"msPetrolTotal",
    header:"MS-PETROL",
    cell: ({row}) => {
      const msPetrolTotal = row.original.msPetrolTotal
      return (
        <div className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium bg-red-100 text-red-800`}>
        {formatCurrency(msPetrolTotal)}
        </div>
      )
    }
  },
  {
    accessorKey: "rate",
    header: "Total Amount",
    cell:({row}) => {
      const rate = row.original.rate

      return (
        <div>
          {formatCurrency(rate)}
        </div>
      )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => <SalesActions sales={row.original} />,
  },
];

const SalesActions = ({ sales }: { sales: Sales }) => {
  const [openReport, setOpenReport] = useState(false);



  const handleExportPDF = async () => {
    try {
      // Fetch report data for the specific date (same format as report-modal)
      const response = await fetch(`/api/reports/${sales.date}`);
      const reportData = await response.json();

      if (!reportData) {
        throw new Error("No report data found");
      }

      // Import jsPDF dynamically
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

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
  doc.text(reportData.branchName || "COCO KONDOTTY", pageWidth / 2, 65, { align: "center" });
  
  // Date (right aligned with table edge)
  doc.setFontSize(11);
  doc.text(`${formatDate(sales.date)}`, pageWidth - marginX, 50, {
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const grouped = reportData.meterReadings.reduce((acc: any, m: any) => {
    const fuel = m.nozzle?.fuelType || "Other";
    if (!acc[fuel]) acc[fuel] = [];
    acc[fuel].push(m);
    return acc;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }, {} as Record<string, any[]>);
  
  // --- Rows ---
  Object.entries(grouped).forEach(([fuelType, readings]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (readings as any[]).forEach((m: any, idx: number) => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (readings as any[]).reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, r: any) => sum + (r.fuelRate || 0) * (r.sale || 0),
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
  if (reportData.oils.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reportData.oils.forEach((o: any) => {
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
      { content: reportData.totals.totalSale, styles: { halign: "center", fillColor: [253, 224, 71], fontStyle: "bold" , fontSize: 10,} },
    ]);
  
    body.push([
      { content: "", colSpan: 6, styles: { minCellHeight: 10 } },
    ]);
  
    // --- Receipts & Expenses ---
    type TableCellData = { content: string | number; colSpan?: number; styles?: Record<string, unknown> };
    type TableRowData = [TableCellData, string | number | TableCellData];
  
    const receiptRows: TableRowData[] = [
      [{ content: "SALE", colSpan: 2, styles: { halign: "center", underline: true, fontStyle: "bold" } }, reportData.totals.totalSale],
      [{ content: "BALANCE RECEIPT", colSpan: 2 , styles: { halign: "center", underline: true, fontStyle: "bold" }}, reportData.totals.totalBalanceReceipt],
      [{ content: "", colSpan: 2 },{content: reportData.totals.salesAndBalaceReceipt, styles: { fillColor: [253, 224, 71]}}],
      [{ content: "EXPENSES", colSpan: 2, styles: { halign: "center", underline: true, fontStyle: "bold" } }, reportData.totals.expenseSum.toFixed(2)],
      [{ content: "BANK DEPOSITES", colSpan: 2, styles: { halign: "center", underline: true, fontStyle: "bold" } }, ""],
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...reportData.bankDeposite.map((b: any) => [{ content: b.bank.bankName, colSpan: 2 }, b.amount] as TableRowData),
      [{ content: "CASH BALANCE", colSpan: 2, styles: { halign: "center", underline: true, fontStyle: "bold" } },
       { content: reportData.totals.cashBalance.toFixed(2), styles: { fillColor: [253, 224, 71], fontStyle: "bold" } } ],
    ];
  
    const expenseRows: TableRowData[] = [
      // Payments
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...reportData.sales.map((s: any) => [{ content: "ATM", colSpan: 2, styles: { fontStyle: "bold" } }, s.atmPayment] as TableRowData),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...reportData.sales.map((s: any) => [{ content: "PAYTM", colSpan: 2, styles: { fontStyle: "bold" } }, s.paytmPayment] as TableRowData),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...reportData.sales.map((s: any) => [{ content: "FLEET", colSpan: 2, styles: { fontStyle: "bold" } }, s.fleetPayment] as TableRowData),
      // Expenses
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...reportData.credits.map((c: any) => [{ content: c.customer?.name, colSpan: 2, styles: { fontStyle: "bold" } }, c.amount] as TableRowData),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...reportData.expenses.map((e: any) => [{ content: e.category.name, colSpan: 2, styles: { fontStyle: "bold" } }, e.amount] as TableRowData),
      [
        { content: "EXPENSES TOTAL", colSpan: 2, styles: { fontStyle: "bold" } },
        { content: reportData.totals.expenseSum.toFixed(2), styles: { fillColor: [253, 224, 71], fontStyle: "bold" } },
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
  
    doc.save(`Daily-Report-${formatDate(sales.date)}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };
  
  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpenReport(true)}
          className="h-8 w-8 p-0"
          title="View Report"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExportPDF}
          className="h-8 w-8 p-0"
          title="Download PDF"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <ReportModal
        open={openReport}
        onOpenChange={setOpenReport}
        date={sales.date}
      />
    </>
  );
};

