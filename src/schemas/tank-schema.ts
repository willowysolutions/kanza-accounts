import { z } from "zod";

export const tankSchema = z.object({
  tankName: z.string().min(1, "Tabk name is required"),
  fuelType: z.string().min(1, "Fuel Type is required"),
  capacity: z.coerce.number().min(1),
  minLevel: z.coerce.number().min(0),
  supplierId: z.string().optional()
});

export const tankSchemaWithId = tankSchema.extend({
  id: z.string(),
});

export type StockInput = z.infer<typeof tankSchema>;
