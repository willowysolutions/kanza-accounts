import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { oilSchemaWithId } from "@/schemas/oil-schema";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = oilSchemaWithId.safeParse({ id: params.id, ...body });

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

    // If same oilType but quantity changes → adjust difference
    if (existingOil.oilType === data.oilType) {
      const diff = data.quantity - existingOil.quantity;
      if (diff !== 0) {
        await prisma.stock.updateMany({
          where: { item: existingOil.oilType },
          data: { quantity: { decrement: diff } }, 
        });
      }
    } else {
      // If oilType changed → return old qty to old type, deduct new qty from new type
      await prisma.stock.updateMany({
        where: { item: existingOil.oilType },
        data: { quantity: { increment: existingOil.quantity } },
      });
      await prisma.stock.updateMany({
        where: { item: data.oilType },
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
  { params }: { params: { id: string } }
) {
  const id = params.id;

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
      where: { item: oil.oilType },
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
