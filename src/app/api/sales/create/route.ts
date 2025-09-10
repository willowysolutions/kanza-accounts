import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { salesSchema } from "@/schemas/sales-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ✅ Validate with Zod
    const result = salesSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const branchId = session?.user?.branch;

    // ✅ Create Sale
    const sale = await prisma.sale.create({
      data: {
        ...result.data,
        branchId,
      },
    });

    const saleDate = new Date(result.data.date);

    // 🔹 Step 1: Find yesterday's BalanceReceipt
    const yesterdayStart = new Date(saleDate);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    yesterdayStart.setHours(0, 0, 0, 0);

    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const yesterdaysReceipt = await prisma.balanceReceipt.findFirst({
      where: {
        branchId,
        date: { gte: yesterdayStart, lte: yesterdayEnd },
      },
    });

    const yesterdaysAmount = yesterdaysReceipt?.amount || 0;

    // 🔹 Step 2: Add today's sale amount + yesterday's balance
    const totalAmount = sale.cashPayment + yesterdaysAmount;

    // 🔹 Step 3: Check if today's receipt exists
    const todayStart = new Date(saleDate);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(saleDate);
    todayEnd.setHours(23, 59, 59, 999);

    const existingReceipt = await prisma.balanceReceipt.findFirst({
      where: {
        branchId,
        date: { gte: todayStart, lte: todayEnd },
      },
    });

    if (existingReceipt) {
      // increment amount with today's sale + yesterday's balance
      await prisma.balanceReceipt.update({
        where: { id: existingReceipt.id },
        data: {
          amount: existingReceipt.amount + sale.rate + yesterdaysAmount,
        },
      });
    } else {
      // create new receipt with sale + yesterday's balance
      await prisma.balanceReceipt.create({
        data: {
          date: new Date(result.data.date),
          amount: totalAmount,
          branchId,
        },
      });
    }

    revalidatePath("/sales");
    return NextResponse.json({ data: sale }, { status: 201 });
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
