import { MachineTank, Machine as PrismaMachine, Tank } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";


export interface Machine extends PrismaMachine {
 machineTanks: (MachineTank & { tank: Tank })[];
 branch: { name: string };
}

export interface MeterReadingTableProps<TValue> {
  columns: ColumnDef<Machine, TValue>[];
  data: Machine[];
}
