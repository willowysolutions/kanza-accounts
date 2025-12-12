"use client";

import { CustomerPaymentTable } from "./customer-payment-table";
import { customerPaymentColumns } from "./payments-column";
import { PaymentWithCustomer } from "@/types/payment";

interface CustomerPaymentTableWrapperProps {
  data: PaymentWithCustomer[];
  userRole?: string;
  branchId?: string;
  isGm?: boolean;
}

export function CustomerPaymentTableWrapper({ data, userRole, branchId, isGm }: CustomerPaymentTableWrapperProps) {
  const columns = customerPaymentColumns(userRole, branchId , isGm);
  return <CustomerPaymentTable data={data} columns={columns} />;
}
