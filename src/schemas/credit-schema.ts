import { z } from 'zod';

export const creditSchema = z.object({
  customerId:z.string().min(2),
  fuelType: z.string(),
  quantity:z.coerce.number(),
  amount: z.coerce.number().min(1),
  date: z.coerce.date(),
});

export const creditSchemaWithId = creditSchema.extend({
  id: z.string(),
});

export type CreditInput = z.infer<typeof creditSchema>;
