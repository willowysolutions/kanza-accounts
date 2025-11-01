"use client";

import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

type PaymentMethodsExportProps = {
  branchName: string;
  selectedMonth: Date;
  paymentMethodsData: { method: string; total: number }[];
  selectedPaymentMode: string;
};

export function PaymentMethodsExport({
  branchName,
  selectedMonth,
  paymentMethodsData,
  selectedPaymentMode,
}: PaymentMethodsExportProps) {
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    // Title
    doc.setFontSize(16);
    let title = `Payment Methods Total - ${branchName}`;
    const monthLabel = format(selectedMonth, "MMMM yyyy");
    title += ` - ${monthLabel}`;
    
    if (selectedPaymentMode !== "all") {
      title += ` (${selectedPaymentMode})`;
    }
    
    doc.text(title, 40, 40);

    // Prepare table data
    const tableBody = paymentMethodsData.map((item) => [
      item.method,
      `${item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    ]);

    // Calculate total
    const grandTotal = paymentMethodsData.reduce((sum, item) => sum + item.total, 0);

    // Generate PDF table
    autoTable(doc, {
      startY: 60,
      head: [["Payment Method", "Total Amount (INR)"]],
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

    // Create filename with branch name, month, and payment mode
    const branchNameForFile = branchName.replace(/\s+/g, '-');
    const monthForFile = format(selectedMonth, 'MMM-yyyy');
    const paymentModeForFile = selectedPaymentMode !== "all" ? `-${selectedPaymentMode}` : "";
    const fileName = `Payment-Methods-${branchNameForFile}-${monthForFile}${paymentModeForFile}.pdf`;
    
    doc.save(fileName);
  };

  return (
    <Button onClick={handleExportPDF} className="bg-black text-white" size="sm">
      <IconFileExport className="h-4 w-4 mr-2" /> Export PDF
    </Button>
  );
}

