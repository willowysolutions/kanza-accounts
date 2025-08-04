import { z } from "zod";

export const salesSchema = z.object({
  customerName: z.string(),
  contactNumber: z.coerce.number().min(1).optional(),
  nozzleId: z.string().min(1),
  fuelType: z.string().min(1),
  quantity: z.coerce.number().min(0),
  rate: z.coerce.number().min(0),
  paymentMethod: z.string().min(0),
  attendant: z.string().min(0),
});

export type SalesInput = z.infer<typeof salesSchema>;
