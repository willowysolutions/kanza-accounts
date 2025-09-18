import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { salesSchemaWithId } from "@/schemas/sales-schema";
import { revalidatePath } from "next/cache";

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
    const result = salesSchemaWithId.safeParse({ id: saleId, ...body });

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

    // Remove id before update
    const { id, ...saleData } = result.data;

    const oldCash = existingSale.cashPayment ?? 0;
    const newCash = saleData.cashPayment ?? 0;
    const diff = newCash - oldCash; // +ve = more cash, -ve = less cash
    const saleDate = new Date(existingSale.date);

    const [updatedSale] = await prisma.$transaction(async (tx) => {
      // 1. Update sale
      const updated = await tx.sale.update({
        where: { id },
        data: {
          ...saleData,
          products: saleData.products ?? {},
        },
      });

      // 2. Adjust BalanceReceipt (only if cashPayment changed)
      if (diff !== 0 && existingSale.branchId) {
        const receipt = await tx.balanceReceipt.findFirst({
          where: {
            branchId: existingSale.branchId,
            date: {
              gte: new Date(saleDate.setHours(0, 0, 0, 0)),
              lte: new Date(saleDate.setHours(23, 59, 59, 999)),
            },
          },
        });

        if (receipt) {
          if (diff > 0) {
            // cash increased → increment branch cash
            await tx.balanceReceipt.update({
              where: { id: receipt.id },
              data: { amount: { increment: diff } },
            });
          } else {
            // cash decreased → decrement branch cash
            await tx.balanceReceipt.update({
              where: { id: receipt.id },
              data: { amount: { decrement: Math.abs(diff) } },
            });
          }
        }
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

    const saleDate = new Date(existingSale.date);

    await prisma.$transaction(async (tx) => {
      // 1. Delete sale
      await tx.sale.delete({
        where: { id: saleId },
      });

      // 2. Adjust BalanceReceipt (decrement cashPayment for that day/branch)
      if (existingSale.cashPayment && existingSale.branchId) {
        const receipt = await tx.balanceReceipt.findFirst({
          where: {
            branchId: existingSale.branchId,
            date: {
              gte: new Date(saleDate.setHours(0, 0, 0, 0)),
              lte: new Date(saleDate.setHours(23, 59, 59, 999)),
            },
          },
        });

        if (receipt) {
          await tx.balanceReceipt.update({
            where: { id: receipt.id },
            data: { amount: { decrement: existingSale.cashPayment } },
          });
        }
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