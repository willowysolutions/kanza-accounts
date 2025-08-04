import { z } from "zod";

export const meterReadingSchema = z.object({
  nozzleId: z.string().min(1),
  fuelType: z.string().min(1),
  readingType: z.string().min(1),
  shift: z.string().min(0),
  meterReading: z.coerce.number().min(0),
  attendant: z.string().min(0),
});

export type MeterReadingInput = z.infer<typeof meterReadingSchema>;
