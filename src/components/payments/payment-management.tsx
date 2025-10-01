"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PaymentWithCustomer, PaymentWithSupplier } from "@/types/payment";
import { PaymentHistory } from "@/types/payment-history";
import { CustomerPaymentTableWrapper } from "./customer-payment-table-wrapper";
import { PaymentHistoryTable } from "./payment-history-table";
import { paymentHistoryColumns } from "./payments-history-column";
import { PurchasePaymentTable } from "./purchase-payment-table";
import { supplierPaymentColumns } from "./purchase-payment-column";

type PaymentManagementProps = {
  customerPayment: PaymentWithCustomer[];
  supplierPayment: PaymentWithSupplier[];
  paymentHistory: PaymentHistory[];
  userRole?: string;
  branchId?: string;
};

export function PaymentManagement({ 
  customerPayment, 
  supplierPayment, 
  paymentHistory, 
  userRole, 
  branchId 
}: PaymentManagementProps) {

  return (
    <Tabs
      defaultValue="due"
      className="w-full"
    >
      <TabsList>
        <TabsTrigger value="due">Sales Due</TabsTrigger>
        <TabsTrigger value="purchase-due">Purchase Due</TabsTrigger>
        <TabsTrigger value="history">Payment History</TabsTrigger>
      </TabsList>

      <TabsContent value="due">
        <CustomerPaymentTableWrapper data={customerPayment} userRole={userRole} branchId={branchId} />
      </TabsContent>

      <TabsContent value="purchase-due">
        <PurchasePaymentTable data={supplierPayment} columns={supplierPaymentColumns} />
      </TabsContent>

      <TabsContent value="history">
        <PaymentHistoryTable data={paymentHistory} columns={paymentHistoryColumns} userRole={userRole} branchId={branchId} />
      </TabsContent>
    </Tabs>
  );
}
