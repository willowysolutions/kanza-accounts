// src/components/payment/payment-tabs.tsx
"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import PaymentTable from "./payment-report-table";

interface Payment {
    id: string | number;
    paidAmount: number;
    paymentMethod: string;
    paidOn: string | Date;
    customer?: { name?: string; outstandingPayments?: number };
    supplier?: { name?: string; outstandingPayments?: number };
}

export default function PaymentTabs({
  customerPayments,
  supplierPayments,
  pagination,
}: {
  customerPayments: Payment[];
  supplierPayments: Payment[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}) {
  return (
    <Tabs defaultValue="customers" className="w-full">
      <TabsList className="mb-4">
        <TabsTrigger value="customers">Customer Payments</TabsTrigger>
        <TabsTrigger value="suppliers">Supplier Payments</TabsTrigger>
      </TabsList>

      <TabsContent value="customers">
        <PaymentTable rows={customerPayments} type="customer" pagination={pagination} />
      </TabsContent>

      <TabsContent value="suppliers">
        <PaymentTable rows={supplierPayments} type="supplier" pagination={pagination} />
      </TabsContent>
    </Tabs>
  );
}
