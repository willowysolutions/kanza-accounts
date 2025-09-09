import { z } from "zod";

export const purchaseSchema = z.object({
  supplierId: z.string(),
  phone: z.string().min(7, "Phone number is required"),
  date:z.coerce.date(),
  productType: z.string().min(1),
  quantity: z.coerce.number().min(0),
  purchasePrice:z.coerce.number(),
  paidAmount:z.coerce.number(),
});

export const purchaseSchemaWithId = purchaseSchema.extend({
  id: z.string(),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
