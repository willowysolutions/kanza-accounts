import { z } from "zod";
import { convertToIST } from "@/lib/date-utils";

export const purchaseSchema = z.object({
  supplierId: z.string(),
  phone: z.string().min(7, "Phone number is required").optional(),
  date: z.coerce.date().transform((date) => convertToIST(date)),
  productType: z.string().min(1),
  quantity: z.coerce.number().min(0),
  purchasePrice:z.coerce.number(),
  paidAmount:z.coerce.number(),
  branchId: z.string().optional(),
});

export const purchaseSchemaWithId = purchaseSchema.extend({
  id: z.string(),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;
