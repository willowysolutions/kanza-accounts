import { z } from "zod";
import { convertToIST } from "@/lib/date-utils";

export const balanceReceiptSchema = z.object({
  date: z.coerce.date().transform((date) => convertToIST(date)),
  amount: z.coerce.number()
});

export const balanceReceiptSchemaWithId = balanceReceiptSchema.extend({
  id: z.string(),
});

export type BalanceReceiptInput = z.infer<typeof balanceReceiptSchema>;
