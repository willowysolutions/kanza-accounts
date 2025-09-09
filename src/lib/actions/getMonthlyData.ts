// app/actions/getMonthlyData.ts
"use server"

import { prisma } from "@/lib/prisma"
import { mergeData } from "@/lib/actions/mergeData"

export async function getMonthlyData() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  const monthlySales = await prisma.sale.groupBy({
    by: ["date"],
    where: { date: { gte: monthStart } },
    _sum: { rate: true },
  })

  const monthlyPurchases = await prisma.purchase.groupBy({
    by: ["date"],
    where: { date: { gte: monthStart } },
    _sum: { purchasePrice: true },
  })

  return mergeData(monthlySales, monthlyPurchases)
}
