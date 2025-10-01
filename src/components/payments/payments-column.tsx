"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { PaymentFormDialog } from "./customer-payment-form-modal";
// import { Customer } from "@prisma/client";
import { PaymentFormData, PaymentWithCustomer } from "@/types/payment";
import { IconCash } from "@tabler/icons-react";



export const customerPaymentColumns = (userRole?: string, userBranchId?: string): ColumnDef<PaymentWithCustomer>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) =>
      row.original && <CustomerNameButton customer={row.original} userRole={userRole} userBranchId={userBranchId} />,
  },
  {
    accessorKey: "outstandingPayments",
    header: "Amount",
  },
  {
    id: "action",
    cell: ({ row }) =>
      row.original && <PaymentButton customer={row.original} userRole={userRole} userBranchId={userBranchId} />,
  },
];

export const CustomerNameButton = ({ customer, userRole, userBranchId }: { customer: PaymentWithCustomer; userRole?: string; userBranchId?: string }) => {
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
    <div>
      <Button variant="link" className="p-0 h-auto font-normal text-left justify-start" onClick={handleOpenPayment}>
        {customer.name}
      </Button>

      {paymentFormData && (
        <PaymentFormDialog
          open={openPayment}
          openChange={setOpenPayment}
          payments={paymentFormData}
          userRole={userRole}
          userBranchId={userBranchId}
        />
      )}
    </div>
  );
};

export const PaymentButton = ({ customer, userRole, userBranchId }: { customer: PaymentWithCustomer; userRole?: string; userBranchId?: string }) => {
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
          userRole={userRole}
          userBranchId={userBranchId}
        />
      )}
    </div>
  );
};
