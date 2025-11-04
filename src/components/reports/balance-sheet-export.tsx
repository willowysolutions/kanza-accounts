 
"use client";

import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

type BalanceSheetExportProps = {
  branchName: string;
  selectedMonth: Date;
  productsData: { product: string; total: number }[];
  customerCreditsData: { customer: string; credit: number; received: number }[];
  expenseCategoriesData: { category: string; total: number }[];
  bankDepositsData: { bank: string; total: number }[];
  customerCreditReceivedData: { 
    customerId?: string;
    customerName: string; 
    openingBalance: number; 
    outstandingAmount: number;
    debitTotal: number; 
    creditTotal: number;
  }[];
  paymentMethodsData: { method: string; total: number }[];
};

export function BalanceSheetExport({
  branchName,
  selectedMonth,
  productsData,
  customerCreditsData,
  expenseCategoriesData,
  bankDepositsData,
  customerCreditReceivedData,
  paymentMethodsData,
}: BalanceSheetExportProps) {
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    // Title
    doc.setFontSize(18);
    doc.text(`${branchName} - Balance Sheet Report`, 40, 40);
    
    doc.setFontSize(14);
    doc.text(`Month: ${format(selectedMonth, "MMMM yyyy")}`, 40, 70);

    const startY = 100;
    const tableWidth = 280; // Width for each table in 2x2 grid
    const tableHeight = 200; // Approximate height for each table
    const spacing = 20; // Space between tables

    // Top Row: Customer Credits & Expense Categories
    // Left: Customer Credits & Received Table
    doc.setFontSize(12);
    doc.text("Customer Credits & Received", 40, startY);

    autoTable(doc, {
      startY: startY + 15,
      head: [["Customer Name", "Debit", "Credit"]],
      body: customerCreditsData.map((item) => [
        item.customer,
        item.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        item.received.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      ]),
      foot: [
        [
          "TOTAL",
          customerCreditsData.reduce((sum, item) => sum + item.credit, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
          customerCreditsData.reduce((sum, item) => sum + item.received, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        ],
      ],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      tableWidth: tableWidth,
      margin: { left: 40, right: 40 },
    });

    // Right: Expense Categories Table
    const rightStartX = 40 + tableWidth + spacing;
    doc.setFontSize(12);
    doc.text("Expense Categories", rightStartX, startY);

    autoTable(doc, {
      startY: startY + 15,
      head: [["Expense", "Total Amount"]],
      body: expenseCategoriesData.map((item) => [
        item.category,
        item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      ]),
      foot: [
        [
          "TOTAL",
          expenseCategoriesData.reduce((sum, item) => sum + item.total, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        ],
      ],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      tableWidth: tableWidth,
      margin: { left: rightStartX, right: 40 },
    });

    // Bottom Row: Products Sold & Bank Deposits
    const bottomStartY = startY + tableHeight + 50;

    // Left: Products Sold Table
    doc.setFontSize(12);
    doc.text("Products Sold", 40, bottomStartY);

    autoTable(doc, {
      startY: bottomStartY + 15,
      head: [["Product", "Total Amount"]],
      body: productsData.map((item) => [
        item.product,
        item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      ]),
      foot: [
        [
          "TOTAL",
          productsData.reduce((sum, item) => sum + item.total, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        ],
      ],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      tableWidth: tableWidth,
      margin: { left: 40, right: 40 },
    });

    // Right: Bank Deposits Table
    doc.setFontSize(12);
    doc.text("Bank Deposits", rightStartX, bottomStartY);

    autoTable(doc, {
      startY: bottomStartY + 15,
      head: [["Bank Name", "Total Deposits"]],
      body: bankDepositsData.map((item) => [
        item.bank,
        item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      ]),
      foot: [
        [
          "TOTAL",
          bankDepositsData.reduce((sum, item) => sum + item.total, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        ],
      ],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      tableWidth: tableWidth,
      margin: { left: rightStartX, right: 40 },
    });

    // Add new page for additional tables
    doc.addPage();

    // Customer Table
    doc.setFontSize(12);
    doc.text("Customer", 40, 40);

    autoTable(doc, {
      startY: 55,
      head: [["Customer Name", "Opening Balance (₹)", "Outstanding Amount (₹)", "Debit Total (₹)", "Credit (₹)"]],
      body: customerCreditReceivedData.map((item) => [
        item.customerName,
        item.openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        item.outstandingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        item.debitTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        item.creditTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      ]),
      foot: [
        [
          "TOTAL",
          customerCreditReceivedData.reduce((sum, item) => sum + item.openingBalance, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
          customerCreditReceivedData.reduce((sum, item) => sum + item.outstandingAmount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
          customerCreditReceivedData.reduce((sum, item) => sum + item.debitTotal, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
          customerCreditReceivedData.reduce((sum, item) => sum + item.creditTotal, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        ],
      ],
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      tableWidth: 520,
      margin: { left: 40, right: 40 },
    });

    // Payment Methods Table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const paymentMethodsStartY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.text("Payment Methods Total", 40, paymentMethodsStartY);

    autoTable(doc, {
      startY: paymentMethodsStartY + 15,
      head: [["Payment Method", "Total Amount"]],
      body: paymentMethodsData.map((item) => [
        item.method,
        item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      ]),
      foot: [
        [
          "TOTAL",
          paymentMethodsData.reduce((sum, item) => sum + item.total, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        ],
      ],
      theme: "grid",
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
      tableWidth: 280,
      margin: { left: 40, right: 40 },
    });

    // Save the PDF
    const fileName = `${branchName.replace(/\s+/g, '-')}-Balance-Sheet-${format(selectedMonth, 'MMM-yyyy')}.pdf`;
    doc.save(fileName);
  };

  return (
    <Button onClick={handleExportPDF} className="bg-black text-white">
      <IconFileExport className="mr-2" /> Export PDF
    </Button>
  );
}
