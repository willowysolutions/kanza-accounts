import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { salesSchemaWithId } from "@/schemas/sales-schema";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";

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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const result = salesSchemaWithId.safeParse({ id: (await params).id, ...body });
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { id: saleId } = await params;

    // Get existing sale
    const existingSale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!existingSale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    // Fetch products (same as POST)
    const [oilT2,hsd, xp, ms] = await Promise.all([
      prisma.product.findFirst({ where: { productName: "2T-OIL" } }),
      prisma.product.findFirst({ where: { productName: "HSD-DIESEL" } }),
      prisma.product.findFirst({ where: { productName: "XP-DIESEL" } }),
      prisma.product.findFirst({ where: { productName: "MS-PETROL" } }),
    ]);

    if (!oilT2 || !hsd || !xp || !ms) {
      return NextResponse.json({ error: "Products not found" }, { status: 404 });
    }

    // Old quantities
    const oldT2Qty = oilT2.sellingPrice ? existingSale.oilT2Total / oilT2.sellingPrice : 0;
    const oldHsdQty = hsd.sellingPrice ? existingSale.hsdDieselTotal / hsd.sellingPrice : 0;
    const oldXpQty = xp.sellingPrice ? existingSale.xgDieselTotal / xp.sellingPrice : 0;
    const oldMsQty = ms.sellingPrice ? existingSale.msPetrolTotal / ms.sellingPrice : 0;

    // New quantities
    const newoilT2Qty = oilT2.sellingPrice ? result.data.oilT2Total / oilT2.sellingPrice : 0;
    const newHsdQty = hsd.sellingPrice ? result.data.hsdDieselTotal / hsd.sellingPrice : 0;
    const newXpQty = xp.sellingPrice ? result.data.xgDieselTotal / xp.sellingPrice : 0;
    const newMsQty = ms.sellingPrice ? result.data.msPetrolTotal / ms.sellingPrice : 0;

    // Differences
    const t2Delta = newoilT2Qty - oldT2Qty;
    const hsdDelta = newHsdQty - oldHsdQty;
    const xpDelta = newXpQty - oldXpQty;
    const msDelta = newMsQty - oldMsQty;

    const updatedSale = await prisma.$transaction(async (tx) => {
      // Update sale
      const updated = await tx.sale.update({
        where: { id: saleId },
        data: result.data,
      });

      // Update stock based on deltas
      const adjustStock = async (productName: string, delta: number) => {
        if (delta === 0) return;

        const stock = await tx.stock.findUnique({ where: { item: productName } });
        if (!stock) throw new Error(`Stock not found for ${productName}`);

        if (delta > 0 && stock.quantity < delta) {
          throw new Error(`Insufficient stock for ${productName}`);
        }

        await tx.stock.update({
          where: { item: productName },
          data: { quantity: { decrement: delta > 0 ? delta : 0, increment: delta < 0 ? Math.abs(delta) : 0 } },
        });
      };

      await adjustStock("2T-OIL", t2Delta);
      await adjustStock("HSD-DIESEL", hsdDelta);
      await adjustStock("XP-DIESEL", xpDelta);
      await adjustStock("MS-PETROL", msDelta);

      return updated;
    });

    revalidatePath("/sales");
    return NextResponse.json({ data: updatedSale }, { status: 200 });
  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


// DELETE Sales
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid ID format" },
      { status: 400 }
    );
  }

  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 });
    }

    const [oilT2Product,hsdDieselProduct, xpDieselProduct,msPetrolProduct] = await Promise.all([
      prisma.product.findFirst({ where: { productName: "2T-OIL" } }),
      prisma.product.findFirst({ where: { productName: "HSD-DIESEL" } }),
      prisma.product.findFirst({ where: { productName: "XP-DIESEL" } }),
      prisma.product.findFirst({ where: { productName: "MS-PETROL" } }),
    ]);

    if (!oilT2Product || !hsdDieselProduct || !xpDieselProduct || !msPetrolProduct) {
      return NextResponse.json(
        { error: "Products not found in stock" },
        { status: 404 }
      );
    }

    // Recalculate sold quantities based on stored totals
    const oilQty = oilT2Product.sellingPrice
      ? Number(sale.oilT2Total) / oilT2Product.sellingPrice
      : 0;
    const hsdQty = hsdDieselProduct.sellingPrice
      ? Number(sale.hsdDieselTotal) / hsdDieselProduct.sellingPrice
      : 0;

    const xpQty = xpDieselProduct.sellingPrice
      ? Number(sale.xgDieselTotal) / xpDieselProduct.sellingPrice
      : 0;

    const msPetrolQty = msPetrolProduct.sellingPrice
      ? Number(sale.msPetrolTotal) / msPetrolProduct.sellingPrice
      : 0;

    // Transaction: increment stock + delete sale
    await prisma.$transaction(async (tx) => {
      await tx.stock.update({
        where: { item: oilT2Product.productName },
        data: {
          quantity: { increment: oilQty },
        },
      });

      await tx.stock.update({
        where: { item: hsdDieselProduct.productName },
        data: {
          quantity: { increment: hsdQty },
        },
      });

      await tx.stock.update({
        where: { item: xpDieselProduct.productName },
        data: {
          quantity: { increment: xpQty },
        },
      });

      await tx.stock.update({
        where: { item: msPetrolProduct.productName },
        data: {
          quantity: { increment: msPetrolQty },
        },
      });

      await tx.sale.delete({
        where: { id },
      });
    });

    return NextResponse.json(
      { message: "Sale deleted successfully and stock restored" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting sale:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}