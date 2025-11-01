"use client";

import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

type CustomerCreditReceivedExportProps = {
  branchName: string;
  selectedMonth: Date;
  customerCreditReceivedData: { customer: string; credit: number; received: number }[];
  selectedCustomer: string;
};

export function CustomerCreditReceivedExport({
  branchName,
  selectedMonth,
  customerCreditReceivedData,
  selectedCustomer,
}: CustomerCreditReceivedExportProps) {
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    // Title
    doc.setFontSize(16);
    let title = `Customer Credit & Received - ${branchName}`;
    const monthLabel = format(selectedMonth, "MMMM yyyy");
    title += ` - ${monthLabel}`;
    
    if (selectedCustomer !== "all") {
      title += ` (${selectedCustomer})`;
    }
    
    doc.text(title, 40, 40);

    // Prepare table data
    const tableBody = customerCreditReceivedData.map((item) => [
      item.customer,
      `${item.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `${item.received.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    ]);

    // Calculate totals
    const totalCredit = customerCreditReceivedData.reduce((sum, item) => sum + item.credit, 0);
    const totalReceived = customerCreditReceivedData.reduce((sum, item) => sum + item.received, 0);

    // Generate PDF table
    autoTable(doc, {
      startY: 60,
      head: [["Customer Name", "Debit (INR)", "Credit (INR)"]],
      body: tableBody,
      foot: [
        [
          "TOTAL",
          `${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          `${totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        ],
      ],
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: "bold" },
    });

    // Create filename with branch name, month, and customer
    const branchNameForFile = branchName.replace(/\s+/g, '-');
    const monthForFile = format(selectedMonth, 'MMM-yyyy');
    const customerForFile = selectedCustomer !== "all" ? `-${selectedCustomer.replace(/\s+/g, '-')}` : "";
    const fileName = `Customer-Credit-Received-${branchNameForFile}-${monthForFile}${customerForFile}.pdf`;
    
    doc.save(fileName);
  };

  return (
    <Button onClick={handleExportPDF} className="bg-black text-white" size="sm">
      <IconFileExport className="h-4 w-4 mr-2" /> Export PDF
    </Button>
  );
}

