import { z } from "zod";

export const expenseSchema = z.object({
  description: z.string().optional(),
  amount: z.coerce.number({ required_error: "Amount is required" }).min(0),
  date: z.coerce.date(),
  expenseCategoryId: z.string().min(1),
  bankId:z.string().optional(),
  reason: z.string().optional(),
  branchId: z.string().optional()
});

export const expenseSchemaWithId = expenseSchema.extend({
    id: z.string(),
})

export type ExpenseInput = z.infer<typeof expenseSchema>;
