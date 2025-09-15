import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { oilSchemaWithId } from "@/schemas/oil-schema";

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
    const body = await req.json();
    const parsed = oilSchemaWithId.safeParse({ id: (await params).id, ...body });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.errors },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    // Fetch existing oil record
    const existingOil = await prisma.oil.findUnique({
      where: { id },
    });
    if (!existingOil) {
      return NextResponse.json({ error: "Oil not found" }, { status: 404 });
    }

    // If same productType but quantity changes → adjust difference
    if (existingOil.productType === data.productType) {
      const diff = data.quantity - existingOil.quantity;
      if (diff !== 0) {
        await prisma.stock.updateMany({
          where: { item: existingOil.productType },
          data: { quantity: { decrement: diff } },
        });
      }
    } else {
      // If oilType changed → return old qty to old type, deduct new qty from new type
      await prisma.stock.updateMany({
        where: { item: existingOil.productType },
        data: { quantity: { increment: existingOil.quantity } },
      });
      await prisma.stock.updateMany({
        where: { item: data.productType },
        data: { quantity: { decrement: data.quantity } },
      });
    }

    // Update oil record
    const oil = await prisma.oil.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: oil }, { status: 200 });
  } catch (error) {
    console.error("Error updating oil:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


//DELETE
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
    const oil = await prisma.oil.findUnique({ where: { id } });
    if (!oil) {
      return NextResponse.json({ error: "Oil not found" }, { status: 404 });
    }

    await prisma.stock.updateMany({
      where: { item: oil.productType },
      data: { quantity: { increment: oil.quantity } },
    });

    // Delete oil record
    const deletedOil = await prisma.oil.delete({
      where: { id },
    });

    return NextResponse.json({ data: deletedOil }, { status: 200 });
  } catch (error) {
    console.error("Error deleting oil:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
