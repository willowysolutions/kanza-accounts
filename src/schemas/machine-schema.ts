import { z } from "zod";

export const machineSchema = z.object({
  machineName: z.string().min(1, "Machine name is required"),
  model: z.string().min(1, "Model is required"),
  serialNumber: z.string().min(1),
  tankId: z.string().min(0),
  noOfNozzles: z.coerce.number(),
  installDate: z.coerce.date(),
});

export type StockInput = z.infer<typeof machineSchema>;
