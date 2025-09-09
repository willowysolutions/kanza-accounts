import z from "zod";

export const bulkSchema = z.object({
  date: z.coerce.date(),
  rows: z
    .array(
      z.object({
        nozzleId: z.string(),
        opening: z.coerce.number().optional(),
        closing: z.coerce.number().optional(),
        sale: z.coerce.number().optional(),
        fuelRate: z.coerce.number().optional(),
        fuelType: z.coerce.string().optional(),
        totalAmount:z.coerce.number().optional(),
      })
    )
    .min(1),
});

export type BulkInput = z.infer<typeof bulkSchema>;
