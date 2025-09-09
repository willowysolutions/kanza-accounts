import { Nozzle as PrismaNozzle } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";


export interface Nozzle extends PrismaNozzle {
  machine: { machineName: string };
}

export interface NozzleTableProps<TValue> {
  columns: ColumnDef<Nozzle, TValue>[];
  data: Nozzle[];
}

export type NozzleType = {
  id:string;
  nozzleNumber :string;
  fuelType: string;
  openingReading: number;
}