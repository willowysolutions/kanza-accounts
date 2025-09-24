import { z } from "zod";
import { convertToIST } from "@/lib/date-utils";

export const bankDepositeSchema = z.object({
  bankId: z.string(),
  date: z.coerce.date().transform((date) => convertToIST(date)),
  amount: z.coerce.number()
});

export const bankDepositeSchemaWithId = bankDepositeSchema.extend({
  id: z.string(),
});

export type BankDepositeInput = z.infer<typeof bankDepositeSchema>;
