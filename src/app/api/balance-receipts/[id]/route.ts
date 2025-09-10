import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { balanceReceiptSchemaWithId } from "@/schemas/balance-receipt";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const parsed = balanceReceiptSchemaWithId.safeParse({ id: (await params).id, ...body });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.errors },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    const balanceReceipt = await prisma.balanceReceipt.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: balanceReceipt }, { status: 200 });
  } catch (error) {
    console.error("Error updating balance Receipt:", error);
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
  const {id} = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { error: "Invalid ID format" },
      { status: 400 }
    );
  }

  try {
    const deletedBalanceReceipt = await prisma.balanceReceipt.delete({
      where: { id },
    });

    return NextResponse.json({ data: deletedBalanceReceipt }, { status: 200 });
  } catch (error) {
    console.error("Error deleting balance Receipt:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
