import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { salesSchemaWithId } from "@/schemas/sales-schema";
import { revalidatePath } from "next/cache";
import { updateBalanceReceiptIST } from "@/lib/ist-balance-utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: saleId } = await params;
    const body = await req.json();
    
    // Transform empty strings to null for nullable payment fields
    const transformedBody = {
      ...body,
      atmPayment: body.atmPayment === "" ? null : body.atmPayment,
      paytmPayment: body.paytmPayment === "" ? null : body.paytmPayment,
      fleetPayment: body.fleetPayment === "" ? null : body.fleetPayment,
    };
    
    const result = salesSchemaWithId.safeParse({ id: saleId, ...transformedBody });

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Fetch existing sale
    const existingSale = await prisma.sale.findUnique({
      where: { id: saleId },
    });
    if (!existingSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Remove id before update and transform empty strings to null
    const { id, ...saleDataRaw } = result.data;
    
    const saleData = {
      ...saleDataRaw,
      atmPayment: saleDataRaw.atmPayment === "" ? null : (saleDataRaw.atmPayment ?? null),
      paytmPayment: saleDataRaw.paytmPayment === "" ? null : (saleDataRaw.paytmPayment ?? null),
      fleetPayment: saleDataRaw.fleetPayment === "" ? null : (saleDataRaw.fleetPayment ?? null),
    };

    const oldCash = existingSale.cashPayment ?? 0;
    const newCash = saleData.cashPayment ?? 0;
    const diff = newCash - oldCash; // +ve = more cash, -ve = less cash

    const [updatedSale] = await prisma.$transaction(async (tx) => {
      // 1. Update sale
      const updated = await tx.sale.update({
        where: { id },
        data: {
          ...saleData,
          products: saleData.products ?? {},
        } as Prisma.SaleUpdateInput,
      });

      // 2. Adjust BalanceReceipt using IST-aware logic (only if cashPayment changed)
      if (diff !== 0 && existingSale.branchId) {
        await updateBalanceReceiptIST(
          existingSale.branchId, 
          existingSale.date, 
          diff, // Positive or negative amount change
          tx,
          { carryForwardOnExisting: false }
        );
      }

      return [updated];
    });

    revalidatePath("/sales");
    return NextResponse.json({ data: updatedSale }, { status: 200 });
  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: saleId } = await params;

    // Fetch sale first
    const existingSale = await prisma.sale.findUnique({
      where: { id: saleId },
    });
    if (!existingSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete sale
      await tx.sale.delete({
        where: { id: saleId },
      });

      // 2. Adjust BalanceReceipt using IST-aware logic (decrement entire amount that was added)
      if (existingSale.cashPayment && existingSale.branchId) {
        // Get the previous day's balance to calculate the total amount that was added
        const previousDay = new Date(existingSale.date);
        previousDay.setDate(previousDay.getDate() - 1);
        
        // Get yesterday's balance receipt amount
        const previousDateString = previousDay.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const { getISTDateRangeForQuery } = await import('@/lib/date-utils');
        const { start, end } = getISTDateRangeForQuery(previousDateString);
        
        const previousReceipt = await tx.balanceReceipt.findFirst({
          where: {
            branchId: existingSale.branchId,
            date: {
              gte: start,
              lte: end,
            },
          },
          orderBy: { date: 'desc' },
        });
        
        const previousBalance = previousReceipt?.amount || 0;
        const totalAmountAdded = previousBalance + existingSale.cashPayment;
        
        // Decrement the entire amount that was added (yesterday's balance + cash payment)
        await updateBalanceReceiptIST(
          existingSale.branchId, 
          existingSale.date, 
          -totalAmountAdded, // Negative amount to decrement the entire amount
          tx,
          { carryForwardOnExisting: false }
        );
      }
    });

    revalidatePath("/sales");
    return NextResponse.json(
      { message: "Sale deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}