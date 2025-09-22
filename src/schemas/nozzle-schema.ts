import { z } from "zod";

export const nozzleSchema = z.object({
  nozzleNumber: z.string().min(1, "Nozzle number is required"),
  machineId: z.string().min(1),
  fuelType: z.string().min(1),
  openingReading: z.coerce.number().min(0),
  branchId: z.string().optional(),
});

export const nozzleSchemaWithId = nozzleSchema.extend({
  id: z.string(),
});

export type NozzleInput = z.infer<typeof nozzleSchema>;
