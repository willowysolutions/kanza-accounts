import { z } from "zod";

export const machineSchema = z.object({
  machineName: z.string().min(1, "Machine name is required"),
  machineTanks: z.array(z.string().min(1, "Tank ID is required")).min(1, "Select at least one tank"), 
  noOfNozzles: z.coerce.number(),
  branchId: z.string().optional(),
});

export const machineSchemaWithId = machineSchema.extend({
  id: z.string(),
});

export type MachineInput = z.infer<typeof machineSchema>;
