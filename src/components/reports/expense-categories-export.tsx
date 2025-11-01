"use client";

import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

type ExpenseCategoriesExportProps = {
  branchName: string;
  selectedMonth: Date;
  expenseCategoriesData: { category: string; total: number }[];
  selectedExpenseCategory: string;
};

export function ExpenseCategoriesExport({
  branchName,
  selectedMonth,
  expenseCategoriesData,
  selectedExpenseCategory,
}: ExpenseCategoriesExportProps) {
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    // Title
    doc.setFontSize(16);
    let title = `Expense Categories - ${branchName}`;
    const monthLabel = format(selectedMonth, "MMMM yyyy");
    title += ` - ${monthLabel}`;
    
    if (selectedExpenseCategory !== "all") {
      title += ` (${selectedExpenseCategory})`;
    }
    
    doc.text(title, 40, 40);

    // Prepare table data
    const tableBody = expenseCategoriesData.map((item) => [
      item.category,
      `${item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    ]);

    // Calculate total
    const grandTotal = expenseCategoriesData.reduce((sum, item) => sum + item.total, 0);

    // Generate PDF table
    autoTable(doc, {
      startY: 60,
      head: [["Expense Category", "Total Amount (INR)"]],
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

    // Create filename with branch name, month, and expense category
    const branchNameForFile = branchName.replace(/\s+/g, '-');
    const monthForFile = format(selectedMonth, 'MMM-yyyy');
    const categoryForFile = selectedExpenseCategory !== "all" ? `-${selectedExpenseCategory.replace(/\s+/g, '-')}` : "";
    const fileName = `Expense-Categories-${branchNameForFile}-${monthForFile}${categoryForFile}.pdf`;
    
    doc.save(fileName);
  };

  return (
    <Button onClick={handleExportPDF} className="bg-black text-white" size="sm">
      <IconFileExport className="h-4 w-4 mr-2" /> Export PDF
    </Button>
  );
}

