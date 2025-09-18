import { Stock as PrismaStock } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";


export interface Stock extends PrismaStock {
  supplier: { name: string };
  branch: { name: string };
}

export interface StockTableProps<TValue> {
  columns: ColumnDef<Stock, TValue>[];
  data: Stock[];
}