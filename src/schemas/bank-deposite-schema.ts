import { z } from "zod";

export const bankDepositeSchema = z.object({
  bankId: z.string(),
  date: z.coerce.date(),
  amount: z.coerce.number(),
  branchId: z.string().optional(),
  description: z.string().optional()
});

export const bankDepositeSchemaWithId = bankDepositeSchema.extend({
  id: z.string(),
});

export type BankDepositeInput = z.infer<typeof bankDepositeSchema>;
