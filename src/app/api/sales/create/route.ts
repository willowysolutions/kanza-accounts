import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { salesSchema } from "@/schemas/sales-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { updateBalanceReceiptIST } from "@/lib/ist-balance-utils";

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
    
    // Use branchId from form data if provided, otherwise fall back to session branch
    const branchId = result.data.branchId || session?.user?.branch;

    // ✅ Check if sale already exists for the same date and branch
    const existingSale = await prisma.sale.findFirst({
      where: {
        branchId,
        date: {
          gte: new Date(result.data.date.getFullYear(), result.data.date.getMonth(), result.data.date.getDate()),
          lt: new Date(result.data.date.getFullYear(), result.data.date.getMonth(), result.data.date.getDate() + 1),
        },
      },
    });

    if (existingSale) {
      return NextResponse.json(
        { error: "A sale already exists for this date." },
        { status: 400 }
      );
    }

    // ✅ Create Sale and update balance receipt in a transaction
    const sale = await prisma.$transaction(async (tx) => {
      // Create sale
      const newSale = await tx.sale.create({
        data: {
          ...result.data,
          branchId,
        },
      });

      // Update balance receipt with cash payment (positive amount = cash received)
      // Note: Only cash payments affect the cash balance, non-cash payments don't
      if (branchId) {
        await updateBalanceReceiptIST(branchId, result.data.date, newSale.cashPayment, tx);
      }

      return newSale;
    });

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
