"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PaymentWithSupplier, SupplierPaymentFormData } from "@/types/payment";
import { IconCash } from "@tabler/icons-react";
import { PurchasePaymentFormDialog } from "./purchase-payment-form-modal";

export const supplierPaymentColumns: ColumnDef<PaymentWithSupplier>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "outstandingPayments",
    header: "Amount",
  },
  {
    id: "action",
    cell: ({ row }) =>
      row.original && <PaymentActionButton supplier={row.original} />,
  },
];

export const PaymentActionButton = ({ supplier }: { supplier: PaymentWithSupplier }) => {
  const [openPayment, setOpenPayment] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState<SupplierPaymentFormData | null>(null);

  const handleOpenPayment = () => {
    setPaymentFormData({
      supplierId: supplier.id,
      amount: Math.abs(supplier.outstandingPayments),
      paymentMethod: "",
      paidOn: new Date(),
      supplierName: supplier.name,
    });
    setOpenPayment(true);
  };

  return (
    <div className="text-right">
      <Button variant="outline" size="sm" className="bg-primary text-primary-foreground" onClick={handleOpenPayment}>
        <IconCash className="size-4 mr-2" /> Pay
      </Button>

      {paymentFormData && (
        <PurchasePaymentFormDialog
          open={openPayment}
          openChange={setOpenPayment}
          payments={paymentFormData}
        />
      )}
    </div>
  );
};
