"use client";

import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type PaymentRow = {
  id: string | number;
  paidAmount: number;
  paymentMethod: string;
  paidOn: string | Date;
  customer?: { name?: string; outstandingPayments?: number } | null;
  supplier?: { name?: string; outstandingPayments?: number } | null;
};

export function PaymentReportExport({
  rows,
  type,
  branchName,
}: {
  rows: PaymentRow[];
  type: "customer" | "supplier";
  branchName?: string;
}) {
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    const branchPart = branchName ? ` - ${branchName}` : " - All Branches";
    const title = `${type === "customer" ? "Customer" : "Supplier"} Payment Report${branchPart}`;
    doc.setFontSize(16);
    doc.text(title, 40, 40);

    const head = [[
      type === "customer" ? "Customer" : "Supplier",
      "Amount",
      "Method",
      "Date",
      "Outstanding",
    ]];

    const body = rows.map((p) => [
      type === "customer" ? p.customer?.name ?? "-" : p.supplier?.name ?? "-",
      p.paidAmount,
      p.paymentMethod,
      new Date(p.paidOn).toLocaleDateString('en-GB'),
      type === "customer" ? (p.customer?.outstandingPayments ?? 0) : (p.supplier?.outstandingPayments ?? 0),
    ]);

    // Calculate totals
    const totalAmount = rows.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
    const totalOutstanding = rows.reduce((sum, p) => {
      const outstanding = type === "customer" 
        ? (p.customer?.outstandingPayments ?? 0)
        : (p.supplier?.outstandingPayments ?? 0);
      return sum + (Number(outstanding) || 0);
    }, 0);

    autoTable(doc, {
      startY: 60,
      head,
      body,
      foot: [
        [
          "Grand Total",
          totalAmount,
          "",
          "",
          totalOutstanding,
        ],
      ],
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [34, 197, 94], textColor: 255 },
      footStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: "bold" },
      didParseCell: (data) => {
        if (data.row.index === rows.length) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [230, 230, 230];
        }
      },
    });

    // Create filename with branch name
    const branchNameForFile = branchName 
      ? branchName.replace(/\s+/g, '-')
      : "All-Branches";
    doc.save(`${type === "customer" ? "Customer" : "Supplier"}-Payments-${branchNameForFile}.pdf`);
  };

  return (
    <Button onClick={handleExportPDF} className="bg-black text-white">
      <IconFileExport className="mr-2" /> Export PDF
    </Button>
  );
}


