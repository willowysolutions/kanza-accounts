// get-last-sale-date.ts
import { prisma } from "@/lib/prisma";

export async function getLastSaleDate(branchId: string) {
  const lastSale = await prisma.sale.findFirst({
    where: { branchId },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  if (!lastSale) return null;

  return lastSale.date;
}
