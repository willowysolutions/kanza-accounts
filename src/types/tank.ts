

import { Tank as PrismaTank } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";


export interface Tank extends PrismaTank {
  supplier: { name: string };
}

export interface MeterReadingTableProps<TValue> {
  columns: ColumnDef<Tank, TValue>[];
  data: Tank[];
}





