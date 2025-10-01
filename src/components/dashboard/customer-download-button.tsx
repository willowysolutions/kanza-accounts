"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState, useEffect } from "react";
import { Customer } from "@/types/customer";

interface CustomerDownloadButtonProps {
  customers: Customer[];
}

export function CustomerDownloadButton({ customers }: CustomerDownloadButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button size="sm" disabled>
        <Download className="h-4 w-4" />
      </Button>
    );
  }

  const handleExportPDF = async () => {
    try {
      if (customers.length === 0) return;

      const customer = customers[0];

      // Fetch customer history data
      const response = await fetch(`/api/customers/${customer.id}/history/`);
      const data = await response.json();
      
      if (!data.history || data.history.length === 0) {
        // If no history, show basic customer info
        const { default: jsPDF } = await import('jspdf');
        const { default: autoTable } = await import('jspdf-autotable');

        const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
        
        doc.setFontSize(14);
        doc.text(
          `Customer Statement - ${customer.name}`,
          40,
          40
        );

        const tableData = [
          ["Customer Name", customer.name],
          ["Email", customer.email || "-"],
          ["Phone", customer.phone || "-"],
          ["Branch", customer.branch?.name || "-"],
          ["Opening Balance", `₹${(customer.openingBalance || 0).toFixed(2)}`],
          ["Pending Amount", `₹${(customer.outstandingPayments || 0).toFixed(2)}`],
        ];

        autoTable(doc, {
          startY: 70,
          head: [["Field", "Value"]],
          body: tableData,
          theme: "grid",
          styles: { fontSize: 10, cellPadding: 3 },
          headStyles: { fillColor: [253, 224, 71], textColor: 0 },
          margin: { left: 40, right: 40 },
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Pending Total: ₹${(customer.outstandingPayments || 0).toFixed(2)}`, 40, finalY);

        doc.save(`Customer-Statement-${customer.name}.pdf`);
        return;
      }

      // Process history data like in the customer history modal
      const history = data.history;
      
      // Sort by date (oldest first) and calculate running balance
      const sorted = [...history].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      let runningBalance = 0;
      const historyWithBalance = sorted.map((item) => {
        if (item.type === "credit") {
          runningBalance += item.amount; // debit increases balance
        } else {
          runningBalance -= item.amount; // payment decreases balance
        }
        return { ...item, balance: runningBalance };
      });

      const total = historyWithBalance.length > 0
        ? historyWithBalance[historyWithBalance.length - 1].balance
        : 0;

      // Import jsPDF dynamically
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      doc.setFontSize(14);
      doc.text(
        `Customer Statement - ${customer.name}`,
        40,
        40
      );

      autoTable(doc, {
        startY: 70,
        head: [["Date", "Fuel Type", "Quantity", "Debit", "Credit", "Balance"]],
        body: historyWithBalance.map((h) => [
          new Date(h.date).toLocaleDateString(),
          h.fuelType || "-",
          h.quantity || "-",
          h.type === "credit" ? `${h.amount}` : "-",
          h.type === "payment" ? `${h.amount}` : "-",
          `${h.balance.toLocaleString()}`,
        ]),
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [253, 224, 71], textColor: 0 },
        margin: { left: 40, right: 40 },
        foot: [
          [
            { content: "Final Total", colSpan: 5, styles: { halign: "right" } },
            { content: `${total.toLocaleString()}`, styles: { halign: "right" } },
          ],
        ],
      });

      doc.save(`Customer-Statement-${customer.name}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <Button size="sm" variant="outline" onClick={handleExportPDF} className="h-8 w-8 p-0">
      <Download className="h-4 w-4" />
    </Button>
  );
}
