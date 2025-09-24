import { z } from 'zod';
import { convertToIST } from "@/lib/date-utils";

const baseCreditSchema = z.object({
  customerId:z.string().min(2),
  fuelType: z.string(),
  quantity:z.coerce.number().optional(),
  amount: z.coerce.number().min(1),
  date: z.coerce.date().transform((date) => convertToIST(date)),
  reason: z.string().optional(),
});

export const creditSchema = baseCreditSchema.refine(() => {
  // This will be handled in the form component based on customer limit
  return true;
}, {
  message: "Reason is required when credit amount exceeds customer limit",
  path: ["reason"],
});

export const creditSchemaWithId = baseCreditSchema.extend({
  id: z.string(),
});

export type CreditInput = z.infer<typeof creditSchema>;
