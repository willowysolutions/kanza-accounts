import { z } from 'zod';

export const customerSchema = z.object({
  name: z.string().min(2),
  email: z.string().optional(),
  phone: z.string().optional(),
  openingBalance: z.coerce.number(),
  outstandingPayments:z.coerce.number().optional(),
  address: z.string().optional(),
});

export const customerSchemaWithId = customerSchema.extend({
  id: z.string(),
});


export type CustomerInput = z.infer<typeof customerSchema>;
