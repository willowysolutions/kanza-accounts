import { z } from 'zod';
import { convertToIST } from "@/lib/date-utils";

export const oilSchema = z.object({
    productType: z.string().min(1, "product Type is required"),
    quantity: z.coerce.number(),
    price: z.coerce.number(),
    date: z.coerce.date().transform((date) => convertToIST(date)),
});

export const oilSchemaWithId = oilSchema.extend({
  id: z.string(),
});

export type SupplierInput = z.infer<typeof oilSchema>;
