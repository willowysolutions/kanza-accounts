import { z } from 'zod';

export const productSchema = z.object({
  productName: z.string().min(2, "Product name is required"),
  productUnit: z.string().min(1),
  purchasePrice: z.coerce.number().min(1),
  sellingPrice: z.coerce.number().min(1),
});

export const productSchemaWithId = productSchema.extend({
  id: z.string(),
});

export type SupplierInput = z.infer<typeof productSchema>;
