import { z } from "zod";

export const stockSchema = z.object({
  item: z.string().min(1, "Item name is required"),
  quantity: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit: z.string().min(1, "Unit is required"),
  reorderLevel: z.coerce.number().min(0, "Reorder level cannot be negative"),
  supplierId: z.string(),
});

export const stockSchemaWithId = stockSchema.extend({
  id: z.string(),
});

export type StockInput = z.infer<typeof stockSchema>;
