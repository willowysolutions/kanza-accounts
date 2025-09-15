import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { purchaseSchemaWithId } from "@/schemas/purchase-schema";
import { ObjectId } from "mongodb";

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
    const { id } = await params;
    const body = await req.json();
    const parsed = purchaseSchemaWithId.safeParse({ id, ...body });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.errors },
        { status: 400 }
      );
    }

    const { id: _omitId, ...data } = parsed.data; void _omitId;

    // Get old purchase before updating
    const oldPurchase = await prisma.purchase.findUnique({
      where: { id },
    });

    if (!oldPurchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    const oldPending = oldPurchase.purchasePrice - oldPurchase.paidAmount;
    const newPending = data.purchasePrice - data.paidAmount;
    const pendingDiff = newPending - oldPending;

    // Update purchase
    const updatedPurchase = await prisma.purchase.update({
      where: { id },
      data:{
        ...data,
        pendingAmount:newPending
      }
    });

    // Update stock quantity (same product only)
    const quantityDiff = updatedPurchase.quantity - oldPurchase.quantity;
    if (quantityDiff !== 0) {
      await prisma.stock.updateMany({
        where: { item: updatedPurchase.productType },
        data: {
          quantity: { increment: quantityDiff },
        },
      });
    }

    // Adjust supplier outstandingPayments
    if (pendingDiff !== 0) {
      await prisma.supplier.update({
        where: { id: updatedPurchase.supplierId },
        data: {
          outstandingPayments: { increment: pendingDiff },
        },
      });
    }

    return NextResponse.json({ data: updatedPurchase }, { status: 200 });
  } catch (error) {
    console.error("Error updating purchases:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

//DELETE
export async function DELETE(
  req: Request,
  context: unknown
) {

  const params = (context as { params?: { id?: string } })?.params ?? {};
  const id = typeof params.id === "string" ? params.id : null;

  if (!id || !ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid ID format" },
      { status: 400 }
    );
  }

  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id },
    });

    if (!purchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    // Decrement stock quantity for the same product
    await prisma.stock.updateMany({
      where: { item: purchase.productType },
      data: {
        quantity: { decrement: purchase.quantity },
      },
    });

    // Delete purchase record
    await prisma.purchase.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Purchase deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting purchase:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
