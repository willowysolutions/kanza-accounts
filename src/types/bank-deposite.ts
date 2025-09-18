import { BankDeposite as PrismaBankDeposite } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";

export interface BankDeposite extends PrismaBankDeposite {
  bank: { bankName: string };
  branch: { name: string };
}


export interface BankDepositeFormProps {
  bankDeposite?: BankDeposite;
  open?: boolean;
  openChange?: (open: boolean) => void;
}

export interface BankDepositeTableProps<TValue> {
  columns: ColumnDef<BankDeposite, TValue>[];
  data: BankDeposite[];
}