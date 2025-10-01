"use client";

import { CustomerPaymentTable } from "./customer-payment-table";
import { customerPaymentColumns } from "./payments-column";
import { PaymentWithCustomer } from "@/types/payment";

interface CustomerPaymentTableWrapperProps {
  data: PaymentWithCustomer[];
  userRole?: string;
  branchId?: string;
}

export function CustomerPaymentTableWrapper({ data, userRole, branchId }: CustomerPaymentTableWrapperProps) {
  const columns = customerPaymentColumns(userRole, branchId);
  return <CustomerPaymentTable data={data} columns={columns} />;
}
