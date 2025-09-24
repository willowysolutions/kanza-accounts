import { z } from "zod";
import { convertToIST } from "@/lib/date-utils";

export const meterReadingSchema = z.object({
  nozzleId: z.string().min(1),
  fuelType: z.string().min(1),
  fuelRate:z.coerce.number(),
  openingReading: z.coerce.number(),
  closingReading: z.coerce.number(),
  difference: z.coerce.number().optional(),
  date: z.coerce.date().transform((date) => convertToIST(date)),
});

export const meterReadingSchemaWithId = meterReadingSchema.extend({
  id: z.string(),
});

export const meterReadingUpdateSchema = z.object({
  id: z.string(),
  nozzleId: z.string().min(1).optional(),
  openingReading: z.coerce.number().optional(),
  closingReading: z.coerce.number().optional(),
  totalAmount: z.coerce.number().optional(),
  date: z.coerce.date().transform((date) => convertToIST(date)).optional(),
});

export type MeterReadingInput = z.infer<typeof meterReadingSchema>;
export type MeterReadingUpdateInput = z.infer<typeof meterReadingUpdateSchema>;
