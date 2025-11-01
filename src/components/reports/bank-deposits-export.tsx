"use client";

import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

type BankDepositsExportProps = {
  branchName: string;
  selectedMonth: Date;
  bankDepositsData: { bank: string; total: number }[];
  selectedBank: string;
};

export function BankDepositsExport({
  branchName,
  selectedMonth,
  bankDepositsData,
  selectedBank,
}: BankDepositsExportProps) {
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    // Title
    doc.setFontSize(16);
    let title = `Bank Deposits - ${branchName}`;
    const monthLabel = format(selectedMonth, "MMMM yyyy");
    title += ` - ${monthLabel}`;
    
    if (selectedBank !== "all") {
      title += ` (${selectedBank})`;
    }
    
    doc.text(title, 40, 40);

    // Prepare table data
    const tableBody = bankDepositsData.map((item) => [
      item.bank,
      `${item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    ]);

    // Calculate total
    const grandTotal = bankDepositsData.reduce((sum, item) => sum + item.total, 0);

    // Generate PDF table
    autoTable(doc, {
      startY: 60,
      head: [["Bank Name", "Total Deposits (INR)"]],
      body: tableBody,
      foot: [
        [
          "TOTAL",
          `${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        ],
      ],
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: "bold" },
    });

    // Create filename with branch name, month, and bank
    const branchNameForFile = branchName.replace(/\s+/g, '-');
    const monthForFile = format(selectedMonth, 'MMM-yyyy');
    const bankForFile = selectedBank !== "all" ? `-${selectedBank.replace(/\s+/g, '-')}` : "";
    const fileName = `Bank-Deposits-${branchNameForFile}-${monthForFile}${bankForFile}.pdf`;
    
    doc.save(fileName);
  };

  return (
    <Button onClick={handleExportPDF} className="bg-black text-white" size="sm">
      <IconFileExport className="h-4 w-4 mr-2" /> Export PDF
    </Button>
  );
}

