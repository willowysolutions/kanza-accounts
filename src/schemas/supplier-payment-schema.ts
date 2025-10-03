import { z } from 'zod';

export const supplierPaymentSchema = z.object({
  supplierId:z.string().min(2),
  amount: z.coerce.number().min(1),
  paymentMethod:z.string().min(1,"Select Payment Method"),
  paidOn: z.coerce.date(),
  branchId: z.string().optional()
});

export const supplierPaymentSchemaWithId = supplierPaymentSchema.extend({
  id: z.string(),
});

export type PaymentInput = z.infer<typeof supplierPaymentSchema>;
