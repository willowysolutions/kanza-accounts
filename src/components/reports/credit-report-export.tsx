"use client";

import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CreditReportExportProps {
  credits: unknown[];
  branchName: string;
  filter: string;
  from?: Date;
  to?: Date;
}

export function CreditReportExport({ 
  credits, 
  branchName, 
  filter, 
  from, 
  to 
}: CreditReportExportProps) {
  const handleExportPDF = async () => {
    // Fetch all credits for export (not just current page)
    try {
      const response = await fetch(`/api/credits?filter=${filter}&from=${from?.toISOString()}&to=${to?.toISOString()}&limit=1000`);
      const { data: allCredits = [] } = await response.json();
      
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

      // Title
      doc.setFontSize(16);
      let title = `Credit Report - ${branchName}`;
      if (from && to) {
        title += ` (${from.toLocaleDateString()} to ${to.toLocaleDateString()})`;
      } else if (filter !== "all") {
        title += ` (${filter})`;
      }
      doc.text(title, 40, 40);

      // Prepare table data
      const tableData = allCredits.map((credit: any) => [ // eslint-disable-line @typescript-eslint/no-explicit-any
        new Date(credit.date).toLocaleDateString(),
        credit.customer?.name ?? "N/A",
        `₹${credit.amount?.toFixed(2) ?? "0.00"}`,
        credit.description ?? "-"
      ]);

      // Add totals row
      const totalAmount = allCredits.reduce((sum: number, credit: any) => sum + (credit.amount || 0), 0); // eslint-disable-line @typescript-eslint/no-explicit-any
      tableData.push([
        "TOTAL",
        "",
        `₹${totalAmount.toFixed(2)}`,
        ""
      ]);

    autoTable(doc, {
      startY: 60,
      head: [["Date", "Customer Name", "Credit Amount", "Description"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      bodyStyles: { fontSize: 9 },
      didParseCell: (data) => {
        // Style the totals row
        if (data.row.index === credits.length) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [230, 230, 230];
        }
      },
    });

    // Add summary at the bottom
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Credits: ₹${totalAmount.toFixed(2)}`, 40, finalY);
    doc.text(`Total Records: ${allCredits.length}`, 40, finalY + 15);

      const filename = `Credit-Report-${branchName}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error("Error fetching credits for export:", error);
      // Fallback to current page data
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      doc.setFontSize(16);
      doc.text(`Credit Report - ${branchName} (Current Page Only)`, 40, 40);
      doc.text("Error loading all credits. Showing current page only.", 40, 60);
      doc.save(`Credit-Report-${branchName}-${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };

  return (
    <Button onClick={handleExportPDF} className="bg-black text-white">
      <IconFileExport className="h-4 w-4 mr-2" /> Export PDF
    </Button>
  );
}
