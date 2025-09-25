'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface DownloadReportButtonProps {
  date: string;
  branchId?: string;
}

export function DownloadReportButton({ date, branchId }: DownloadReportButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button size="sm" disabled>
        <Download className="h-4 w-4" />
      </Button>
    );
  }

  const handleExportPDF = async () => {
    try {
      // Fetch report data for the specific date (same format as report-modal)
      const url = branchId ? `/api/reports/${date}?branchId=${branchId}` : `/api/reports/${date}`;
      const response = await fetch(url);
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

      // Date (right aligned with table edge) - Convert UTC date to IST
      doc.setFontSize(11);
      const utcDate = new Date(date + 'T00:00:00.000Z');
      const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
      const formattedDate = istDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      doc.text(formattedDate, pageWidth - marginX, 50, {
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
        // Group oils by productType to avoid duplicates
        const oilGroups = reportData.oils.reduce((acc: Record<string, { productType: string; quantity: number; amount: number; price: number }>, oil: { productType: string; quantity: number; amount: number; price: number }) => {
          const key = oil.productType;
          if (!acc[key]) {
            acc[key] = {
              productType: oil.productType,
              quantity: 0,
              amount: 0,
              price: oil.price
            };
          }
          acc[key].quantity += oil.quantity;
          acc[key].amount += oil.amount;
          return acc;
        }, {});

        // Add grouped oils to the table
        (Object.values(oilGroups) as { productType: string; quantity: number; amount: number; price: number }[]).forEach((oil) => {
          if (oil.productType.toUpperCase() === "2T-OIL") {
            // ✅ Special style for 2T OIL
            body.push([
              { content: oil.productType, styles: { fillColor: [255, 0, 0], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" } },
              "",
              "",
              oil.quantity,
              "",
              oil.price,
            ]);
          } else {
            // Normal oil rows
            body.push([oil.productType, "", "", oil.quantity, "", oil.price]);
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

      doc.save(`Daily-Report-${formatDate(date)}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleExportPDF}
      className="h-8 w-8 p-0"
      title="Download PDF"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
}
