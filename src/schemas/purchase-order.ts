import { z } from "zod";

export const purchaseOrderSchema = z.object({
  supplierId: z.string(),
  productType: z.string().min(1),
  quantity: z.coerce.number().min(0),
  orderDate:z.coerce.date()
});

export const purchaseOrderSchemaWithId = purchaseOrderSchema.extend({
  id: z.string(),
});

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;
