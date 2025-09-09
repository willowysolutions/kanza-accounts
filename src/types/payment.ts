import { CustomerPayment as PrismaCustomerPayment } from "@prisma/client";
import { SupplierPayment as PrismaSupplierPayment } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";


export type PaymentWithCustomer = PrismaCustomerPayment & {
  name: string;
  outstandingPayments: number;
  customerName: string;
  paidOn: Date;
};

export interface PaymentTableProps<TData = PaymentWithCustomer, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export type PaymentWithSupplier = PrismaSupplierPayment & {
  name: string;
  outstandingPayments: number;
  supplierName: string;
  paidOn: Date;
};

export interface PurchasePaymentTableProps<TData = PaymentWithSupplier, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export interface PaymentFormData {
  id?: string | null;  
  customerId: string;
  branchId?: string | null;
  amount: number;
  paymentMethod: string;
  paidOn: Date;
  customerName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SupplierPaymentFormData {
  id?: string | null;  
  supplierId: string;
  branchId?: string | null;
  amount: number;
  paymentMethod: string;
  paidOn: Date;
  supplierName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
