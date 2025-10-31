"use client";

import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type SalesReportExportProps = {
  sales: {
    id: string;
    date: Date;
    branch?: { name?: string | null } | null;
    atmPayment: number;
    paytmPayment: number;
    fleetPayment: number;
    xgDieselTotal: number;
    hsdDieselTotal: number;
    msPetrolTotal: number;
    rate: number;
  }[];
  filter: string;
  from?: Date;
  to?: Date;
};

export function SalesReportExport({ sales, filter, from, to }: SalesReportExportProps) {
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    // Determine branch name(s) for title and filename
    const uniqueBranches = new Set(sales.map(s => s.branch?.name).filter(Boolean));
    const branchNames = Array.from(uniqueBranches);
    const branchNameForTitle = branchNames.length === 1 
      ? branchNames[0] 
      : branchNames.length > 1 
      ? `All Branches (${branchNames.length})`
      : "All Branches";
    
    doc.setFontSize(16);
    let title = `Sales Report - ${branchNameForTitle} (${filter})`;
    if (from && to) {
      title += ` - ${from.toLocaleDateString('en-GB')} to ${to.toLocaleDateString('en-GB')}`;
    }
    doc.text(title, 40, 40);

    autoTable(doc, {
      startY: 60,
      head: [["Date", "Branch", "ATM", "Paytm", "Fleet", "XG Diesel", "HSD Diesel", "MS Petrol", "Total"]],
      body: [
        ...sales.map((s) => [
          new Date(s.date).toLocaleDateString('en-GB'),
          s.branch?.name ?? "-",
          s.atmPayment,
          s.paytmPayment,
          s.fleetPayment,
          s.xgDieselTotal,
          s.hsdDieselTotal,
          s.msPetrolTotal,
          s.rate,
        ]),
        [
          "Grand Total",
          "",
          sales.reduce((sum, s) => sum + s.atmPayment, 0),
          sales.reduce((sum, s) => sum + s.paytmPayment, 0),
          sales.reduce((sum, s) => sum + s.fleetPayment, 0),
          sales.reduce((sum, s) => sum + s.xgDieselTotal, 0),
          sales.reduce((sum, s) => sum + s.hsdDieselTotal, 0),
          sales.reduce((sum, s) => sum + s.msPetrolTotal, 0),
          sales.reduce((sum, s) => sum + s.rate, 0),
        ],
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      bodyStyles: { fontSize: 9 },
      didParseCell: (data) => {
        if (data.row.index === sales.length) {
          // Last row = totals
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [230, 230, 230];
        }
      },
    });

    // Create filename with branch name
    const branchNameForFile = branchNames.length === 1 
      ? (branchNames[0] as string).replace(/\s+/g, '-')
      : "All-Branches";
    doc.save(`Sales-Report-${branchNameForFile}-${filter}.pdf`);
  };

  return (
    <Button onClick={handleExportPDF} className="bg-black text-white">
      <IconFileExport /> Export PDF
    </Button>
  );
}
