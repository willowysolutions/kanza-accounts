"use client";

import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

type ProductsSoldExportProps = {
  branchName: string;
  selectedMonth: Date;
  productsData: { product: string; total: number }[];
  selectedProduct: string;
};

export function ProductsSoldExport({
  branchName,
  selectedMonth,
  productsData,
  selectedProduct,
}: ProductsSoldExportProps) {
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });

    // Title
    doc.setFontSize(16);
    let title = `Products Sold - ${branchName}`;
    const monthLabel = format(selectedMonth, "MMMM yyyy");
    title += ` - ${monthLabel}`;
    
    if (selectedProduct !== "all") {
      title += ` (${selectedProduct})`;
    }
    
    doc.text(title, 40, 40);

    // Prepare table data
    const tableBody = productsData.map((item) => [
      item.product,
      `${item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    ]);

    // Calculate total
    const grandTotal = productsData.reduce((sum, item) => sum + item.total, 0);

    // Generate PDF table
    autoTable(doc, {
      startY: 60,
      head: [["Product", "Total Amount (INR)"]],
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

    // Create filename with branch name, month, and product
    const branchNameForFile = branchName.replace(/\s+/g, '-');
    const monthForFile = format(selectedMonth, 'MMM-yyyy');
    const productForFile = selectedProduct !== "all" ? `-${selectedProduct.replace(/\s+/g, '-')}` : "";
    const fileName = `Products-Sold-${branchNameForFile}-${monthForFile}${productForFile}.pdf`;
    
    doc.save(fileName);
  };

  return (
    <Button onClick={handleExportPDF} className="bg-black text-white" size="sm">
      <IconFileExport className="h-4 w-4 mr-2" /> Export PDF
    </Button>
  );
}

