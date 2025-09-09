import { z } from "zod";

export const expenseCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export const expenseCategorySchemaWithId = expenseCategorySchema.extend({
  id: z.string(),
});


export type ExpenseCategoryInput = z.infer<typeof expenseCategorySchema>;
