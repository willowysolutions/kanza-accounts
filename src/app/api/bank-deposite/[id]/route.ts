import { prisma } from "@/lib/prisma";
import { ObjectId } from "mongodb";
import { bankDepositeSchemaWithId } from "@/schemas/bank-deposite-schema";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = bankDepositeSchemaWithId.safeParse({ id: params.id, ...body });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.errors },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    const existingDeposite = await prisma.bankDeposite.findUnique({
      where: { id },
    });

    if (!existingDeposite) {
      return NextResponse.json(
        { error: "Deposit not found" },
        { status: 404 }
      );
    }

    const oldAmount = existingDeposite.amount;
    const newAmount = data.amount;
    const difference = newAmount - oldAmount;

    const [bankDeposite] = await prisma.$transaction([
      prisma.bankDeposite.update({
        where: { id },
        data,
      }),
      prisma.bank.update({
        where: { id: existingDeposite.bankId },
        data: {
          balanceAmount: {
            increment: difference,
          },
        },
      }),
    ]);

    return NextResponse.json({ data: bankDeposite }, { status: 200 });
  } catch (error) {
    console.error("Error updating bank deposit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  try {
    const existingDeposite = await prisma.bankDeposite.findUnique({
      where: { id },
    });

    if (!existingDeposite) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    const [deletedBankDeposite] = await prisma.$transaction([
      prisma.bankDeposite.delete({ where: { id } }),
      prisma.bank.update({
        where: { id: existingDeposite.bankId },
        data: {
          balanceAmount: { decrement: existingDeposite.amount },
        },
      }),
    ]);

    return NextResponse.json({ data: deletedBankDeposite }, { status: 200 });
  } catch (error) {
    console.error("Error deleting bank deposit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}