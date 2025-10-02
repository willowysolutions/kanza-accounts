import { z } from 'zod';

export const customerPaymentSchema = z.object({
  customerId:z.string().min(2),
  amount: z.coerce.number().min(1),
  paymentMethod:z.string().min(1,"Select Payment Method"),
  paidOn: z.coerce.date(),
});

export const customerPaymentSchemaWithId = customerPaymentSchema.extend({
  id: z.string(),
});

export const paymentSchema = z.object({
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  paidAmount: z.coerce.number().min(1),
  paymentMethod: z.string().min(1, "Select Payment Method"),
  paidOn: z.coerce.date(),
  branchId: z.string(),
});

export const paymentSchemaWithId = paymentSchema.extend({
  id: z.string(),
});

export type PaymentInput = z.infer<typeof customerPaymentSchema>;
export type PaymentWithId = z.infer<typeof paymentSchemaWithId>;
