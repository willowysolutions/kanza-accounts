import { z } from 'zod';

export const supplierSchema = z.object({
  SupplierId:z.string().min(2),
  name: z.string().min(2, "Supplier name is required"),
  email: z.string().optional(),
  phone: z.string().optional(),
  openingBalance: z.coerce.number(),
  outstandingPayments:z.coerce.number().optional(),
  address: z.string().optional(),
});

export const supplierSchemaWithId = supplierSchema.extend({
  id: z.string(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
