import { Credit as PrismaCredit } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";


export interface Credit extends PrismaCredit {
  customer: { name: string };
}

export interface CreditTableProps<TValue> {
  columns: ColumnDef<Credit, TValue>[];
  data: Credit[];
}