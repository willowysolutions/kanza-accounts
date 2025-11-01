// app/actions/getMonthlyData.ts
"use server"

import { prisma } from "@/lib/prisma"
import { mergeData } from "@/lib/actions/mergeData"

export async function getMonthlyData(branchId?: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Fetch data for the last 90 days (3 months) to support all time ranges
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 90)

  // Build where clause with branch filter
  const salesWhere = branchId ? { date: { gte: startDate }, branchId } : { date: { gte: startDate } }
  const purchasesWhere = branchId ? { date: { gte: startDate }, branchId } : { date: { gte: startDate } }

  const monthlySales = await prisma.sale.groupBy({
    by: ["date"],
    where: salesWhere,
    _sum: { rate: true },
  })

  const monthlyPurchases = await prisma.purchase.groupBy({
    by: ["date"],
    where: purchasesWhere,
    _sum: { purchasePrice: true },
  })

  return mergeData(monthlySales, monthlyPurchases)
}
