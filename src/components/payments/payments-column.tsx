"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PaymentFormDialog } from "./customer-payment-form-modal";
// import { Customer } from "@prisma/client";
import { PaymentFormData, PaymentWithCustomer } from "@/types/payment";
import { IconCash } from "@tabler/icons-react";



export const customerPaymentColumns: ColumnDef<PaymentWithCustomer>[] = [
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
      row.original && <PaymentButton customer={row.original} />,
  },
];

export const PaymentButton = ({ customer }: { customer: PaymentWithCustomer }) => {
  const [openPayment, setOpenPayment] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData | null>(null);

  const handleOpenPayment = () => {
    setPaymentFormData({
      customerId: customer.id,
      amount: Math.abs(customer.outstandingPayments),
      paymentMethod: "",
      paidOn: new Date(),
      customerName: customer.name,
    });
    setOpenPayment(true);
  };

  return (
    <div className="text-right">
       <Button variant="outline" className="bg-primary text-primary-foreground" size="sm" onClick={handleOpenPayment}>
        <IconCash className="size-4 mr-2  " /> Pay
      </Button>

      {paymentFormData && (
        <PaymentFormDialog
          open={openPayment}
          openChange={setOpenPayment}
          payments={paymentFormData}
        />
      )}
    </div>
  );
};
