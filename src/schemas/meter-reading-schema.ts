import { z } from "zod";

export const meterReadingSchema = z.object({
  nozzleId: z.string().min(1),
  fuelType: z.string().min(1),
  fuelRate:z.coerce.number(),
  openingReading: z.coerce.number(),
  closingReading: z.coerce.number(),
  difference: z.coerce.number().optional(),
  date: z.coerce.date(),
});

export const meterReadingSchemaWithId = meterReadingSchema.extend({
  id: z.string(),
});

export type MeterReadingInput = z.infer<typeof meterReadingSchema>;
