import { prisma } from "@/lib/prisma";
import { ObjectId } from "mongodb";
import { bankDepositeSchemaWithId } from "@/schemas/bank-deposite-schema";
import { NextResponse } from "next/server";

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
    const parsed = bankDepositeSchemaWithId.safeParse({ id: (await params).id, ...body });

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
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    const oldAmount = existingDeposite.amount;
    const newAmount = data.amount;
    const difference = newAmount - oldAmount;

    const depositDate = new Date(existingDeposite.date);

    const [bankDeposite] = await prisma.$transaction(async (tx) => {
      // 1. Update deposit
      const updatedDeposit = await tx.bankDeposite.update({
        where: { id },
        data,
      });

      // 2. Update bank balance
      await tx.bank.update({
        where: { id: existingDeposite.bankId },
        data: { balanceAmount: { increment: difference } },
      });

      // 3. Adjust BalanceReceipt (reverse since deposits reduce branch cash)
      const existingReceipt = await tx.balanceReceipt.findFirst({
        where: {
          branchId: existingDeposite.branchId,
          date: {
            gte: new Date(depositDate.setHours(0, 0, 0, 0)),
            lte: new Date(depositDate.setHours(23, 59, 59, 999)),
          },
        },
      });

      if (existingReceipt) {
        await tx.balanceReceipt.update({
          where: { id: existingReceipt.id },
          data: { amount: { decrement: difference } }, 
        });
      }

      return [updatedDeposit];
    });

    return NextResponse.json({ data: bankDeposite }, { status: 200 });
  } catch (error) {
    console.error("Error updating bank deposit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(
  req: Request,
   { params }: { params: Promise<{ id: string }> }
) {
  const {id} = await params;

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

    const depositDate = new Date(existingDeposite.date);

    const [deletedBankDeposite] = await prisma.$transaction(async (tx) => {
      // 1. Delete deposit
      const removedDeposit = await tx.bankDeposite.delete({ where: { id } });

      // 2. Decrement bank balance
      await tx.bank.update({
        where: { id: existingDeposite.bankId },
        data: { balanceAmount: { decrement: existingDeposite.amount } },
      });

      // 3. Increment back in BalanceReceipt (since deletion cancels earlier decrement)
      const existingReceipt = await tx.balanceReceipt.findFirst({
        where: {
          branchId: existingDeposite.branchId,
          date: {
            gte: new Date(depositDate.setHours(0, 0, 0, 0)),
            lte: new Date(depositDate.setHours(23, 59, 59, 999)),
          },
        },
      });

      if (existingReceipt) {
        await tx.balanceReceipt.update({
          where: { id: existingReceipt.id },
          data: { amount: { increment: existingDeposite.amount } },
        });
      }

      return [removedDeposit];
    });

    return NextResponse.json({ data: deletedBankDeposite }, { status: 200 });
  } catch (error) {
    console.error("Error deleting bank deposit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
