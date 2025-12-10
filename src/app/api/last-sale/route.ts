import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get("branchId");

  if (!branchId) return NextResponse.json({ lastSaleDate: null });

  const lastSale = await prisma.sale.findFirst({
    where: { branchId },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  return NextResponse.json({
    lastSaleDate: lastSale?.date ?? null,
  });
}
