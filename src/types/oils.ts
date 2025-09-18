import { Oil as PrismaOil } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";


export interface Oil extends PrismaOil {
  branch: { name: string };
}


export interface OilTableProps<TValue> {
  columns: ColumnDef<Oil, TValue>[];
  data: Oil[];
}