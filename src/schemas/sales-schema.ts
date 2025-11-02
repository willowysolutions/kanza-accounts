import { z } from "zod";

export const salesSchema = z.object({
  date: z.coerce.date(),
  cashPayment: z.coerce.number().min(0),
  atmPayment: z.coerce.number().min(0),
  paytmPayment: z.coerce.number().min(0),
  fleetPayment: z.coerce.number().min(0),
  // dynamic product totals keyed by productType (e.g., "2T-OIL", "GAS", "ADBLUE")
  products: z.record(z.string(), z.coerce.number().min(0)),
  // legacy fields (optional for backward compatibility)
  xgDieselTotal: z.coerce.number().min(0).optional(),
  hsdDieselTotal: z.coerce.number().min(0).optional(),
  msPetrolTotal: z.coerce.number().min(0).optional(),
  powerPetrolTotal: z.coerce.number().min(0).optional(),
  // dynamic fuel totals (stores any fuel type: { "HSD-DIESEL": 1000, "POWER PETROL": 500, ... })
  fuelTotals: z.record(z.string(), z.coerce.number().min(0)).optional(),
  rate: z.coerce.number().min(0),
  branchId: z.string().optional()
});

export const salesSchemaWithId = salesSchema.extend({
  id: z.string(),
});

export type SalesFormValues = z.infer<typeof salesSchema>; // without id
export type SalesFormValuesWithId = z.infer<typeof salesSchemaWithId>; // with id
