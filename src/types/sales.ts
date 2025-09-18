import { Sale as PrismaSales } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";


export interface Sales extends PrismaSales {
  nozzle: { nozzleNumber: string; fuelType:string};
  branch: { name: string };
}

export interface SalesTableProps<TValue> {
  columns: ColumnDef<Sales, TValue>[];
  data: Sales[];
}