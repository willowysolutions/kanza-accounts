"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PaymentWithCustomer, PaymentWithSupplier } from "@/types/payment";
import { PaymentHistory } from "@/types/payment-history";
import { CustomerPaymentTable } from "./customer-payment-table";
import { PaymentHistoryTable } from "./payment-history-table";
import { customerPaymentColumns } from "./payments-column";
import { paymentHistoryColumns } from "./payments-history-column";
import { PurchasePaymentTable } from "./purchase-payment-table";
import { supplierPaymentColumns } from "./purchase-payment-column";

type PaymentManagementProps = {
  customerPayment: PaymentWithCustomer[];
  supplierPayment:PaymentWithSupplier[];
  paymentHistory: PaymentHistory[];
};

export default function PaymentManagement({ customerPayment,supplierPayment ,paymentHistory}: PaymentManagementProps) {

  return (
    <div className="@container/main flex flex-1 flex-col gap-2">
      <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payment Management</h1>
            <p className="text-muted-foreground">Manage fuel and inventory payments</p>
          </div>
        </div>

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
            <CustomerPaymentTable data={customerPayment} columns={customerPaymentColumns} />
          </TabsContent>

          <TabsContent value="purchase-due">
            <PurchasePaymentTable data={supplierPayment} columns={supplierPaymentColumns} />
          </TabsContent>

          <TabsContent value="history">
            <PaymentHistoryTable data={paymentHistory} columns={paymentHistoryColumns} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
