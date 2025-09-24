import { z } from 'zod';
import { convertToIST } from "@/lib/date-utils";

export const paymentHistorySchema = z.object({
  customerId:z.string().min(2),
  paidAmount: z.coerce.number().min(1),
  paymentMethod:z.string(),
  painOn: z.coerce.date().transform((date) => convertToIST(date)),
});

export const paymentHistorySchemaWithId = paymentHistorySchema.extend({
  id: z.string(),
});

export type PaymentInput = z.infer<typeof paymentHistorySchema>;
