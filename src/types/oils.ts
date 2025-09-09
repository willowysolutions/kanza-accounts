import { Oil } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";




export interface OilTableProps<TValue> {
  columns: ColumnDef<Oil, TValue>[];
  data: Oil[];
}