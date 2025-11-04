"use client";

import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

type CustomerCreditReceivedExportProps = {
  branchName: string;
  selectedMonth: Date;
  customerCreditReceivedData: { 
    customerId?: string;
    customerName: string; 
    openingBalance: number; 
    outstandingAmount: number;
    debitTotal: number; 
    creditTotal: number;
  }[];
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
    let title = `Customer - ${branchName}`;
    const monthLabel = format(selectedMonth, "MMMM yyyy");
    title += ` - ${monthLabel}`;
    
    if (selectedCustomer !== "all") {
      title += ` (${selectedCustomer})`;
    }
    
    doc.text(title, 40, 40);

    // Prepare table data
    const tableBody = customerCreditReceivedData.map((item) => [
      item.customerName,
      `${item.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `${item.outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `${item.debitTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      `${item.creditTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    ]);

    // Calculate totals
    const totalOpeningBalance = customerCreditReceivedData.reduce((sum, item) => sum + item.openingBalance, 0);
    const totalOutstanding = customerCreditReceivedData.reduce((sum, item) => sum + item.outstandingAmount, 0);
    const totalDebit = customerCreditReceivedData.reduce((sum, item) => sum + item.debitTotal, 0);
    const totalCredit = customerCreditReceivedData.reduce((sum, item) => sum + item.creditTotal, 0);

    // Generate PDF table
    autoTable(doc, {
      startY: 60,
      head: [["Customer Name", "Opening Balance", "Outstanding Amount", "Debit Total", "Credit"]],
      body: tableBody,
      foot: [
        [
          "TOTAL",
          `${totalOpeningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          `${totalOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          `${totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
          `${totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        ],
      ],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: "bold" },
    });

    // Create filename with branch name, month, and customer
    const branchNameForFile = branchName.replace(/\s+/g, '-');
    const monthForFile = format(selectedMonth, 'MMM-yyyy');
    const customerForFile = selectedCustomer !== "all" ? `-${selectedCustomer.replace(/\s+/g, '-')}` : "";
    const fileName = `Customer-${branchNameForFile}-${monthForFile}${customerForFile}.pdf`;
    
    doc.save(fileName);
  };

  return (
    <Button onClick={handleExportPDF} className="bg-black text-white" size="sm">
      <IconFileExport className="h-4 w-4 mr-2" /> Export PDF
    </Button>
  );
}

