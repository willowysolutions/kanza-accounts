import { z } from "zod";

export const balanceReceiptSchema = z.object({
  date: z.coerce.date(),
  amount: z.coerce.number()
});

export const balanceReceiptSchemaWithId = balanceReceiptSchema.extend({
  id: z.string(),
});

export type BalanceReceiptInput = z.infer<typeof balanceReceiptSchema>;
