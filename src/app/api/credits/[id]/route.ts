import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { creditSchemaWithId } from "@/schemas/credit-schema";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = creditSchemaWithId.safeParse({ id: params.id, ...body });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.errors },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    // Get existing credit
    const existingCredit = await prisma.credit.findUnique({
      where: { id },
    });

    if (!existingCredit) {
      return NextResponse.json({ error: "Credit not found" }, { status: 404 });
    }

    // Calculate balance difference
    const oldAmount = existingCredit.amount;
    const newAmount = data.amount;
    const diff = newAmount - oldAmount;

    // Update credit + adjust balance in one transaction
    const [updatedCredit] = await prisma.$transaction([
      prisma.credit.update({
        where: { id },
        data,
      }),
      prisma.customer.update({
        where: { id: existingCredit.customerId },
        data: {
          openingBalance: diff > 0
            ? { decrement: diff } // amount increased → subtract extra from balance
            : { increment: Math.abs(diff) }, // amount decreased → add back to balance
        },
      }),
    ]);

    return NextResponse.json({ data: updatedCredit }, { status: 200 });
  } catch (error) {
    console.error("Error updating credit:", error);
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
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  try {
    // Find credit to delete
    const existingCredit = await prisma.credit.findUnique({
      where: { id },
    });

    if (!existingCredit) {
      return NextResponse.json({ error: "Credit not found" }, { status: 404 });
    }

    // Delete credit + restore balance in one transaction
    const [deletedCredit] = await prisma.$transaction([
      prisma.credit.delete({
        where: { id },
      }),
      prisma.customer.update({
        where: { id: existingCredit.customerId },
        data: {
          openingBalance: { increment: existingCredit.amount }, // Add back deleted credit amount
        },
      }),
    ]);

    return NextResponse.json({ data: deletedCredit }, { status: 200 });
  } catch (error) {
    console.error("Error deleting credit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
