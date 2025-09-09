import { Bank } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";


export interface BankFormProps {
  bank?: Bank;
  open?: boolean;
  openChange?: (open: boolean) => void;
}

export interface BankTableProps<TValue> {
  columns: ColumnDef<Bank, TValue>[];
  data: Bank[];
}