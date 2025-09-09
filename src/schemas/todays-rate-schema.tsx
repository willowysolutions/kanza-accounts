import { z } from "zod";

export const rateSchema = z.object({
  petrol: z.coerce.number().min(0, "Rate must be positive"),
  diesel: z.coerce.number().min(0, "Rate must be positive"),
  cng: z.coerce.number().min(0, "Rate must be positive"),
});

export const rateSchemaWithId = rateSchema.extend({
  id: z.string(),
});

export type RateFormValues = z.infer<typeof rateSchema>;
