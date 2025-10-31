"use client";

import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Row = {
  date: Date;
  sales: number;
  purchases: number;
  expenses: number;
  customerPayments: number;
  finalTotal: number;
};

type Totals = {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  totalCustomerPayments: number;
  totalFinal: number;
};

type GeneralReportExportProps = {
  rows: Row[];
  totals: Totals;
  filter: string;
  from?: Date;
  to?: Date;
  branches?: { id: string; name: string }[];
};

export function GeneralReportExport({
  rows,
  totals,
  filter,
  from,
  to,
  branches,
}: GeneralReportExportProps) {
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    // Determine branch name(s) for title and filename
    const branchNameForTitle = branches && branches.length === 1
      ? branches[0].name
      : branches && branches.length > 1
      ? `All Branches (${branches.length})`
      : "All Branches";

    doc.setFontSize(16);
    let title = `General Report - ${branchNameForTitle} (${filter})`;
    if (from && to) {
      title += ` - ${from.toLocaleDateString('en-GB')} to ${to.toLocaleDateString('en-GB')}`;
    }
    doc.text(title, 40, 40);

    autoTable(doc, {
      startY: 60,
      head: [
        ["Date", "Sales", "Purchases", "Expenses", "Credit Received", "Final Total"],
      ],
      body: rows.map((r) => [
        new Date(r.date).toLocaleDateString('en-GB'),
        r.sales,
        r.purchases,
        r.expenses,
        r.customerPayments,
        r.finalTotal,
      ]),
      foot: [
        [
          "Grand Total",
          totals.totalSales,
          totals.totalPurchases,
          totals.totalExpenses,
          totals.totalCustomerPayments,
          totals.totalFinal,
        ],
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    });

    // Create filename with branch name
    const branchNameForFile = branches && branches.length === 1
      ? branches[0].name.replace(/\s+/g, '-')
      : "All-Branches";
    doc.save(`General-Report-${branchNameForFile}-${filter}.pdf`);
  };

  return (
    <Button onClick={handleExportPDF} className="bg-black text-white">
      <IconFileExport /> Export PDF
    </Button>
  );
}
