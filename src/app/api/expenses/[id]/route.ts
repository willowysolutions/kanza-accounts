import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { expenseSchemaWithId } from "@/schemas/expense-schema";

// PATCH - Update Expense and adjust bank + sale
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const parsed = expenseSchemaWithId.safeParse({ id: params.id, ...body });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.errors },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;

    const oldExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!oldExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const expense = await prisma.$transaction(async (tx) => {
      const updatedExpense = await tx.expense.update({
        where: { id },
        data,
      });

      const amountDiff = data.amount - oldExpense.amount;

      // --- Adjust Bank ---
      if (oldExpense.bankId) {
        await tx.bank.update({
          where: { id: oldExpense.bankId },
          data: {
            balanceAmount:
              amountDiff > 0
                ? { decrement: amountDiff }
                : { increment: Math.abs(amountDiff) },
          },
        });
      }

      // --- Adjust Sale (same date + branch) ---
      const sale = await tx.sale.findFirst({
        where: {
          date: new Date(oldExpense.date), // use oldExpense.date to locate
          branchId: oldExpense.branchId,
        },
      });

      if (sale && amountDiff !== 0) {
        await tx.sale.update({
          where: { id: sale.id },
          data: {
            rate:
              amountDiff > 0
                ? { decrement: amountDiff } // increased expense → reduce sale
                : { increment: Math.abs(amountDiff) }, // reduced expense → add back
          },
        });
      }

      return updatedExpense;
    });

    return NextResponse.json({ data: expense }, { status: 200 });
  } catch (error) {
    console.error("Error updating expenses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove expense and refund to bank + sale
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }

  try {
    const oldExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!oldExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const deletedExpense = await prisma.$transaction(async (tx) => {
      const removed = await tx.expense.delete({ where: { id } });

      // --- Refund Bank ---
      if (oldExpense.bankId) {
        await tx.bank.update({
          where: { id: oldExpense.bankId },
          data: { balanceAmount: { increment: oldExpense.amount } },
        });
      }

      // --- Refund Sale (same date + branch) ---
      const sale = await tx.sale.findFirst({
        where: {
          date: new Date(oldExpense.date),
          branchId: oldExpense.branchId,
        },
      });

      if (sale) {
        await tx.sale.update({
          where: { id: sale.id },
          data: { rate: { increment: oldExpense.amount } },
        });
      }

      return removed;
    });

    return NextResponse.json({ data: deletedExpense }, { status: 200 });
  } catch (error) {
    console.error("Error deleting expenses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
