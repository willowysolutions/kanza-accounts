import { BalanceReceipt as PrismaBalanceReceipt } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

export interface BalanceReceipt extends PrismaBalanceReceipt {
  branch: { name: string };
}


export interface BalanceReceiptFormProps {
  balanceReceipt?: BalanceReceipt;
  open?: boolean;
  openChange?: (open: boolean) => void;
}

export interface BalanceReceiptTableProps<TValue> {
  columns: ColumnDef<BalanceReceipt, TValue>[];
  data: BalanceReceipt[];
}