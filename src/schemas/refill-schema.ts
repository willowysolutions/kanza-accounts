import { z } from "zod";

export const refillTankSchema = z.object({
    tankId:z.string(),
    refillAmount: z.coerce.number().min(1, 'Enter valid amount'),
})

export type RefillInput = z.infer<typeof refillTankSchema>;
