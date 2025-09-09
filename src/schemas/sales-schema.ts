import { z } from "zod";

export const salesSchema = z.object({
  date:z.coerce.date(),
  cashPayment: z.coerce.number().min(0),
  atmPayment: z.coerce.number().min(0),
  paytmPayment: z.coerce.number().min(0),
  fleetPayment: z.coerce.number().min(0),
  oilT2Total: z.coerce.number().min(0),
  gasTotal: z.coerce.number().min(0),
  xgDieselTotal: z.coerce.number().min(0),
  hsdDieselTotal: z.coerce.number().min(0),
  msPetrolTotal: z.coerce.number().min(0),
  rate: z.coerce.number().min(0),
});

export const salesSchemaWithId = salesSchema.extend({
  id: z.string(),
});

export type SalesInput = z.infer<typeof salesSchema>;
