import { PaymentHistory as PrismaPaymentHistory } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";


export interface PaymentHistory extends PrismaPaymentHistory {
  customer: { name: string };
  supplier: {name:string};
}

export interface PaymentHistoryTableProps<TValue> {
  columns: ColumnDef<PaymentHistory, TValue>[];
  data: PaymentHistory[];
  userRole?: string;
  isGm?: boolean;
}