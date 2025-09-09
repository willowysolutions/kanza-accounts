"use client";

import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type PurchaseReportExportProps = {
  purchases: {
    id: string;
    date: Date;
    supplier?: { name?: string | null } | null;
    branch?: { name?: string | null } | null;
    phone?: string | null;
    productType: string;
    quantity: number;
    purchasePrice: number;
    paidAmount: number;
    pendingAmount: number;
  }[];
  filter: string;
  from?: Date;
  to?: Date;
};

export function PurchaseReportExport({ purchases, filter, from, to }: PurchaseReportExportProps) {
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    // Title
    doc.setFontSize(16);
    let title = `Purchase Report (${filter})`;
    if (from && to) {
      title += ` - ${from.toLocaleDateString()} to ${to.toLocaleDateString()}`;
    }
    doc.text(title, 40, 40);

    // Build table with totals row
    autoTable(doc, {
      startY: 60,
      head: [
        [
          "Date",
          "Supplier",
          "Branch",
          "Phone",
          "Product",
          "Quantity",
          "Purchase Price",
          "Paid Amount",
          "Pending Amount",
        ],
      ],
      body: [
        ...purchases.map((p) => [
          new Date(p.date).toLocaleDateString(),
          p.supplier?.name ?? "-",
          p.branch?.name ?? "-",
          p.phone ?? "-",
          p.productType,
          p.quantity,
          p.purchasePrice,
          p.paidAmount,
          p.pendingAmount,
        ]),
        [
          "Grand Total",
          "",
          "",
          "",
          "",
          purchases.reduce((sum, p) => sum + p.quantity, 0),
          purchases.reduce((sum, p) => sum + p.purchasePrice, 0),
          purchases.reduce((sum, p) => sum + p.paidAmount, 0),
          purchases.reduce((sum, p) => sum + p.pendingAmount, 0),
        ],
      ],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [96, 165, 250], textColor: 255 }, // blue header
      didParseCell: (data) => {
        if (data.row.index === purchases.length) {
          // Totals row styling
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [230, 230, 230];
        }
      },
    });

    doc.save(`Purchase-Report-${filter}.pdf`);
  };

  return (
    <Button onClick={handleExportPDF} className="bg-black text-white">
      <IconFileExport className="mr-2" /> Export PDF
    </Button>
  );
}
