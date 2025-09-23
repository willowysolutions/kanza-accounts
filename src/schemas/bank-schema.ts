import { z } from "zod";

export const bankSchema = z.object({
  bankName: z.string().min(1, "bank name is required"),
  branchId: z.string().min(1, "branch is required"),
  accountNumber: z.coerce.number().min(1, "account number is required"),
  ifse: z.string().min(1, "enter IFSE"),
  balanceAmount: z.coerce.number()
});

export const bankSchemaWithId = bankSchema.extend({
  id: z.string(),
});

export type StockInput = z.infer<typeof bankSchema>;
