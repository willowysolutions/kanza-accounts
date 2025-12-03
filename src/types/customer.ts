import { Customer as PrismaCustomer } from "@prisma/client";


export interface Customer extends PrismaCustomer {
  branch: { name: string };
  calculatedOpeningBalance?: number; // Optional: calculated opening balance for current month
}