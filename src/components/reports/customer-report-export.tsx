"use client";

import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  openingBalance: number;
  outstandingPayments: number;
};

export function CustomerReportExport({ customers }: { customers: Customer[] }) {
  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    doc.setFontSize(16);
    doc.text("Customer Report", 40, 40);

    const head = [[
      "Name",
      "Phone",
      "Opening Balance",
      "Outstanding Payments",
    ]];

    const body = customers.map((c) => [
      c.name,
      c.phone ?? "-",
      c.openingBalance,
      c.outstandingPayments,
    ]);

    body.push([
      "Grand Total",
      "",
      "",
      customers.reduce((sum, c) => sum + (Number(c.openingBalance) || 0), 0),
      customers.reduce((sum, c) => sum + (Number(c.outstandingPayments) || 0), 0),
    ]);

    autoTable(doc, {
      startY: 60,
      head,
      body,
      theme: "grid",
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      didParseCell: (data) => {
        if (data.row.index === customers.length) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [230, 230, 230];
        }
      },
    });

    doc.save("Customer-Report.pdf");
  };

  return (
    <Button onClick={handleExportPDF} className="bg-black text-white">
      <IconFileExport className="mr-2" /> Export PDF
    </Button>
  );
}


