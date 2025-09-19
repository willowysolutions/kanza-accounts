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
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const body = await req.json();
    const parsed = bankDepositeSchemaWithId.safeParse({ id, ...body });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.errors },
        { status: 400 }
      );
    }

    const { id: _omitId, ...data } = parsed.data;
    void _omitId;

    const existingDeposite = await prisma.bankDeposite.findUnique({
      where: { id },
    });

    if (!existingDeposite) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    const oldAmount = existingDeposite.amount;
    const newAmount = data.amount;
    const difference = newAmount - oldAmount;

    const oldDate = new Date(existingDeposite.date);
    const newDate = new Date(data.date);

    const [bankDeposite] = await prisma.$transaction(async (tx) => {
      // 1. Update deposit
      const updatedDeposit = await tx.bankDeposite.update({
        where: { id },
        data,
      });

      // 2. Update bank balance
      if (difference !== 0) {
        if (difference > 0) {
          await tx.bank.update({
            where: { id: existingDeposite.bankId },
            data: { balanceAmount: { increment: difference } },
          });
        } else {
          await tx.bank.update({
            where: { id: existingDeposite.bankId },
            data: { balanceAmount: { decrement: Math.abs(difference) } },
          });
        }
      }

      // 3. Adjust BalanceReceipt
      if (oldDate.toDateString() === newDate.toDateString()) {
        // Same date → adjust only by difference
        const receipt = await tx.balanceReceipt.findFirst({
          where: {
            branchId: existingDeposite.branchId,
            date: {
              gte: new Date(oldDate.setHours(0, 0, 0, 0)),
              lte: new Date(oldDate.setHours(23, 59, 59, 999)),
            },
          },
        });

        if (receipt && difference !== 0) {
          await tx.balanceReceipt.update({
            where: { id: receipt.id },
            data: {
              amount:
                difference > 0
                  ? { decrement: difference } // deposit ↑ → cash ↓
                  : { increment: Math.abs(difference) }, // deposit ↓ → cash ↑
            },
          });
        }
      } else {
        // Date changed → restore old, apply new
        const oldReceipt = await tx.balanceReceipt.findFirst({
          where: {
            branchId: existingDeposite.branchId,
            date: {
              gte: new Date(oldDate.setHours(0, 0, 0, 0)),
              lte: new Date(oldDate.setHours(23, 59, 59, 999)),
            },
          },
        });

        const newReceipt = await tx.balanceReceipt.findFirst({
          where: {
            branchId: existingDeposite.branchId,
            date: {
              gte: new Date(newDate.setHours(0, 0, 0, 0)),
              lte: new Date(newDate.setHours(23, 59, 59, 999)),
            },
          },
        });

        // Restore old receipt (add back old deposit amount)
        if (oldReceipt) {
          await tx.balanceReceipt.update({
            where: { id: oldReceipt.id },
            data: { amount: { increment: oldAmount } },
          });
        }

        // Apply new receipt (reduce by new deposit amount)
        if (newReceipt) {
          await tx.balanceReceipt.update({
            where: { id: newReceipt.id },
            data: { amount: { decrement: newAmount } },
          });
        }
      }

      return [updatedDeposit];
    });

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

export async function DELETE(
  req: Request,
  // Next.js' type checker for route contexts can be overly strict; keep this untyped
  // to satisfy the build while we validate at runtime.
  context: unknown
) {
  const params = (context as { params?: { id?: string } })?.params ?? {};
  const idParam = typeof params.id === "string" ? params.id : null;

  if (!idParam || !ObjectId.isValid(idParam)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  try {
    const existingDeposite = await prisma.bankDeposite.findUnique({
      where: { id: idParam },
    });

    if (!existingDeposite) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    const depositDate = new Date(existingDeposite.date);

    const [deletedBankDeposite] = await prisma.$transaction(async (tx) => {
      // 1. Delete deposit
      const removedDeposit = await tx.bankDeposite.delete({ where: { id: idParam } });

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
