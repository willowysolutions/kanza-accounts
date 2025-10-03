import { z } from "zod";

export const salesSchema = z.object({
  date: z.coerce.date(),
  cashPayment: z.coerce.number().min(0),
  atmPayment: z.coerce.number().min(0),
  paytmPayment: z.coerce.number().min(0),
  fleetPayment: z.coerce.number().min(0),
  // dynamic product totals keyed by productType (e.g., "2T-OIL", "GAS", "ADBLUE")
  products: z.record(z.string(), z.coerce.number().min(0)),
  // retain legacy fields to satisfy existing Prisma model
  xgDieselTotal: z.coerce.number().min(0),
  hsdDieselTotal: z.coerce.number().min(0),
  msPetrolTotal: z.coerce.number().min(0),
  rate: z.coerce.number().min(0),
  branchId: z.string().optional()
});

export const salesSchemaWithId = salesSchema.extend({
  id: z.string(),
});

export type SalesFormValues = z.infer<typeof salesSchema>; // without id
export type SalesFormValuesWithId = z.infer<typeof salesSchemaWithId>; // with id
