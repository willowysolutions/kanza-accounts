import { z } from "zod";

export const purchaseSchema = z.object({
  supplierId: z.string(),
  contactNumber: z.coerce.number().min(1).optional(),
  productType: z.string().min(1),
  quantity: z.coerce.number().min(0),
  unitRate: z.coerce.number().min(0),
  deliveryDate: z.coerce.date(),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
