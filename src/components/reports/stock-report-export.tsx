"use client";

import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

type StockReportItem = {
  product: string;
  date: Date | string;
  purchaseQty: number;
  saleQty: number;
  balanceStock: number;
};

type StockReportExportProps = {
  stockReport: StockReportItem[];
  branchName: string;
  filter: string;
  from?: Date;
  to?: Date;
};

export function StockReportExport({
  stockReport,
  branchName,
  filter,
  from,
  to,
}: StockReportExportProps) {
  const handleExportPDF = () => {
    if (!stockReport || stockReport.length === 0) {
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    // Title
    doc.setFontSize(16);
    let title = `Stock Report - ${branchName}`;
    
    // Add date range info
    let dateLabel = "";
    if (from && to) {
      dateLabel = `${format(from, "dd/MM/yyyy")} - ${format(to, "dd/MM/yyyy")}`;
    } else {
      dateLabel = filter.charAt(0).toUpperCase() + filter.slice(1);
    }
    title += ` (${dateLabel})`;
    
    doc.text(title, 40, 40);

    // Prepare table data
    const tableBody = stockReport.map((item) => [
      item.product,
      format(new Date(item.date), "dd/MM/yyyy"),
      item.purchaseQty.toFixed(2),
      item.saleQty.toFixed(2),
      item.balanceStock.toFixed(2),
    ]);

    // Generate PDF table
    autoTable(doc, {
      startY: 60,
      head: [["Product", "Date", "Purchase Qty", "Sale Qty", "Balance Stock"]],
      body: tableBody,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
    });

    // Create filename
    const branchNameForFile = branchName.replace(/\s+/g, '-');
    const dateForFile = from && to 
      ? `${format(from, 'dd-MM-yyyy')}_${format(to, 'dd-MM-yyyy')}`
      : filter;
    const fileName = `Stock-Report-${branchNameForFile}-${dateForFile}.pdf`;
    
    doc.save(fileName);
  };

  return (
    <Button 
      onClick={handleExportPDF} 
      className="bg-black text-white" 
      size="sm"
      disabled={!stockReport || stockReport.length === 0}
    >
      <IconFileExport className="h-4 w-4 mr-2" /> Export PDF
    </Button>
  );
}

