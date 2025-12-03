 
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

    // Page dimensions in landscape A4
    const pageWidth = 842; // A4 landscape width
    const pageHeight = 595; // A4 landscape height
    const margin = 40;
    const spacing = 30;
    const tableWidth = (pageWidth - (margin * 2) - spacing) / 2; // Equal width for two columns
    const minSpaceForTable = 150; // Minimum space needed for a table with heading

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredSpace: number, currentY: number) => {
      if (currentY + requiredSpace > pageHeight - margin) {
        doc.addPage();
        // Add title if this is a new page (not the first page)
        if (doc.getCurrentPageInfo().pageNumber > 1) {
          doc.setFontSize(18);
          doc.text(`${branchName} - Balance Sheet Report`, margin, 40);
          doc.setFontSize(14);
          doc.text(`Month: ${format(selectedMonth, "MMMM yyyy")}`, margin, 65);
        }
        return 90; // Start below title and month text
      }
      return currentY;
    };

    // Helper function to add page without title (for pages 2+)
    const addPageWithoutTitle = () => {
      doc.addPage();
      return margin + 20; // Start at top of page without title
    };

    // Title on first page
    doc.setFontSize(18);
    doc.text(`${branchName} - Balance Sheet Report`, margin, 40);
    doc.setFontSize(14);
    doc.text(`Month: ${format(selectedMonth, "MMMM yyyy")}`, margin, 65);

    // Page 1: Customer Credits & Received (full width)
    let currentY = 90; // Start section headings below the title and month text
    currentY = checkPageBreak(minSpaceForTable, currentY);
    doc.setFontSize(12);
    doc.text("Customer Credits & Received", margin, currentY);

    const fullTableWidth = pageWidth - (margin * 2);
    autoTable(doc, {
      startY: currentY + 15,
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
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', cellWidth: 'wrap' },
      headStyles: { fillColor: [253, 224, 71], textColor: 0, fontStyle: 'bold' },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: fullTableWidth * 0.5 },
        1: { halign: 'right', cellWidth: fullTableWidth * 0.25 },
        2: { halign: 'right', cellWidth: fullTableWidth * 0.25 },
      },
      tableWidth: fullTableWidth,
      margin: { left: margin, right: margin },
      pageBreak: 'avoid',
      showHead: 'everyPage',
    });

    // Page 2: Expense Categories (full width)
    currentY = addPageWithoutTitle();
    
    // Ensure we have plenty of space (at least 300pt) for heading + table start
    // This prevents autoTable from moving to a new page
    const minRequiredSpace = 300;
    const availableSpace = pageHeight - margin - currentY;
    
    // If not enough space, create new page BEFORE placing heading
    if (availableSpace < minRequiredSpace) {
      doc.addPage();
      currentY = margin + 20;
    }
    
    // Place heading
    doc.setFontSize(12);
    doc.text("Expense Categories", margin, currentY);
    
    // Final check: ensure table start position is well within page bounds
    const tableStartY = currentY + 15;
    const maxTableStartY = pageHeight - margin - 100; // Leave at least 100pt at bottom
    
    if (tableStartY > maxTableStartY) {
      // If table would start too close to bottom, move both to next page
      doc.addPage();
      currentY = margin + 20;
      doc.setFontSize(12);
      doc.text("Expense Categories", margin, currentY);
    }

    autoTable(doc, {
      startY: currentY + 15,
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
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', cellWidth: 'wrap' },
      headStyles: { fillColor: [253, 224, 71], textColor: 0, fontStyle: 'bold' },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: fullTableWidth * 0.6 },
        1: { halign: 'right', cellWidth: fullTableWidth * 0.4 },
      },
      tableWidth: fullTableWidth,
      margin: { left: margin, right: margin },
      showHead: 'everyPage',
      pageBreak: 'avoid',
    });

    // Page 3: Products Sold, Bank Deposits, and Payment Methods Total
    currentY = addPageWithoutTitle();
    const rightStartX = margin + tableWidth + spacing;
    
    // Top: Products Sold (left) and Bank Deposits (right)
    currentY = checkPageBreak(minSpaceForTable, currentY);
    const topRowY = currentY;
    
    // Left: Products Sold Table
    doc.setFontSize(12);
    doc.text("Products Sold", margin, topRowY);

    autoTable(doc, {
      startY: topRowY + 15,
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
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', cellWidth: 'wrap' },
      headStyles: { fillColor: [253, 224, 71], textColor: 0, fontStyle: 'bold' },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: tableWidth * 0.6 },
        1: { halign: 'right', cellWidth: tableWidth * 0.4 },
      },
      tableWidth: tableWidth,
      margin: { left: margin, right: margin + tableWidth + spacing },
      pageBreak: 'avoid',
      showHead: 'everyPage',
    });

    // Get finalY from Products Sold table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const productsTableFinalY = (doc as any).lastAutoTable?.finalY || topRowY + 15;

    // Right: Bank Deposits Table
    doc.setFontSize(12);
    doc.text("Bank Deposits", rightStartX, topRowY);

    autoTable(doc, {
      startY: topRowY + 15,
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
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', cellWidth: 'wrap' },
      headStyles: { fillColor: [253, 224, 71], textColor: 0, fontStyle: 'bold' },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: tableWidth * 0.6 },
        1: { halign: 'right', cellWidth: tableWidth * 0.4 },
      },
      tableWidth: tableWidth,
      margin: { left: rightStartX, right: margin },
      pageBreak: 'avoid',
      showHead: 'everyPage',
    });

    // Get finalY from Bank Deposits table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bankDepositsTableFinalY = (doc as any).lastAutoTable?.finalY || topRowY + 15;

    // Bottom: Payment Methods Total (full width)
    // Use the maximum finalY from both tables above, plus spacing
    currentY = Math.max(productsTableFinalY, bankDepositsTableFinalY) + 30;
    currentY = checkPageBreak(minSpaceForTable, currentY);
    doc.setFontSize(12);
    doc.text("Payment Methods Total", margin, currentY);

    autoTable(doc, {
      startY: currentY + 15,
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
      styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak', cellWidth: 'wrap' },
      headStyles: { fillColor: [253, 224, 71], textColor: 0, fontStyle: 'bold' },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: fullTableWidth * 0.6 },
        1: { halign: 'right', cellWidth: fullTableWidth * 0.4 },
      },
      tableWidth: fullTableWidth,
      margin: { left: margin, right: margin },
      pageBreak: 'avoid',
      showHead: 'everyPage',
    });

    // Page 4: Customer Table (5 columns)
    currentY = addPageWithoutTitle();
    currentY = checkPageBreak(minSpaceForTable, currentY);
    const customerTableY = currentY;
    doc.setFontSize(12);
    doc.text("Customer", margin, customerTableY);

    const customerTableWidth = pageWidth - (margin * 2);
    autoTable(doc, {
      startY: customerTableY + 15,
      head: [["Customer Name", "Opening Balance", "Outstanding Amount", "Debit Total", "Credit Total"]],
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
      styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak', cellWidth: 'wrap' },
      headStyles: { fillColor: [253, 224, 71], textColor: 0, fontStyle: 'bold' },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: customerTableWidth * 0.3 },
        1: { halign: 'right', cellWidth: customerTableWidth * 0.175 },
        2: { halign: 'right', cellWidth: customerTableWidth * 0.175 },
        3: { halign: 'right', cellWidth: customerTableWidth * 0.175 },
        4: { halign: 'right', cellWidth: customerTableWidth * 0.175 },
      },
      tableWidth: customerTableWidth,
      margin: { left: margin, right: margin },
      pageBreak: 'avoid',
      showHead: 'everyPage',
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
