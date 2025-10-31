"use client";

import { Button } from "@/components/ui/button";
import { IconFileExport } from "@tabler/icons-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface CreditReportExportProps {
  credits: unknown[];
  branchName: string;
  branchId?: string;
  filter: string;
  from?: Date;
  to?: Date;
}

export function CreditReportExport({ 
  branchName,
  branchId,
  filter, 
  from, 
  to 
}: CreditReportExportProps) {
  const handleExportPDF = async () => {
    // Fetch all credits for export (not just current page)
    try {
      // Build API URL with branchId if provided
      const apiUrl = new URL('/api/credits', window.location.origin);
      apiUrl.searchParams.set('filter', filter);
      if (branchId) {
        apiUrl.searchParams.set('branchId', branchId);
      }
      if (from) {
        apiUrl.searchParams.set('from', from.toISOString());
      }
      if (to) {
        apiUrl.searchParams.set('to', to.toISOString());
      }
      apiUrl.searchParams.set('limit', '1000');
      
      const response = await fetch(apiUrl.toString());
      const { data: allCredits = [] } = await response.json();
      
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

      // Title
      doc.setFontSize(16);
      let title = `Credit Report - ${branchName}`;
      if (from && to) {
        title += ` (${from.toLocaleDateString('en-GB')} to ${to.toLocaleDateString('en-GB')})`;
      } else if (filter !== "all") {
        title += ` (${filter})`;
      }
      doc.text(title, 40, 40);

      // Calculate running balance for each customer
      const customerCredits: { [key: string]: unknown[] } = {};
      allCredits.forEach((credit: unknown) => {
        const customerId = (credit as { customer?: { id?: string } }).customer?.id;
        if (customerId) {
          if (!customerCredits[customerId]) {
            customerCredits[customerId] = [];
          }
          customerCredits[customerId].push(credit);
        }
      });

      // Sort credits by date for each customer and calculate running balance
      const creditsWithBalance: unknown[] = [];
      Object.values(customerCredits).forEach((customerCreditList) => {
        // Sort by date
        const sortedCredits = customerCreditList.sort((a, b) => new Date((a as { date: string }).date).getTime() - new Date((b as { date: string }).date).getTime());
        
        let runningBalance = 0;
        sortedCredits.forEach((credit) => {
          runningBalance += (credit as { amount?: number }).amount || 0;
          creditsWithBalance.push({
            ...(credit as Record<string, unknown>),
            runningBalance: runningBalance
          });
        });
      });

      // Sort all results by date
      const sortedCreditsWithBalance = creditsWithBalance.sort((a, b) => new Date((a as { date: string }).date).getTime() - new Date((b as { date: string }).date).getTime());

      // Prepare table data
      const tableData = sortedCreditsWithBalance.map((credit: unknown) => [
        new Date((credit as { date: string }).date).toLocaleDateString('en-GB'),
        (credit as { customer?: { name?: string } }).customer?.name ?? "N/A",
        `${(credit as { amount?: number }).amount?.toFixed(2) ?? "0.00"}`,
        `${(credit as { runningBalance?: number }).runningBalance?.toFixed(2) ?? "0.00"}`,
        (credit as { description?: string }).description ?? "-"
      ]);

      // Add totals row
      const totalAmount = allCredits.reduce((sum: number, credit: unknown) => sum + ((credit as { amount?: number }).amount || 0), 0);
      tableData.push([
        "TOTAL",
        "",
        `${totalAmount.toFixed(2)}`,
        "",
        ""
      ]);

    autoTable(doc, {
      startY: 60,
      head: [["Date", "Customer Name", "Credit Amount", "Balance Due", "Description"]],
      body: tableData,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [253, 224, 71], textColor: 0 },
      bodyStyles: { fontSize: 9 },
      didParseCell: (data) => {
        // Style the totals row
        if (data.row.index === sortedCreditsWithBalance.length) {
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
    doc.text(`Total Credits: ${totalAmount.toFixed(2)}`, 40, finalY);
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
