import { MeterReading as PrismaMeterReading } from "@prisma/client";
import { ColumnDef } from "@tanstack/react-table";


export interface MeterReading extends PrismaMeterReading {
  nozzle: { nozzleNumber: string };
}

export interface MeterReadingTableProps<TValue> {
  columns: ColumnDef<MeterReading, TValue>[];
  data: MeterReading[];
}



export type MeterReadingType = {
  nozzleId:string;
  fuelType: string;
  id: string;
  readingType:string;
  difference:number;
  date:Date
}