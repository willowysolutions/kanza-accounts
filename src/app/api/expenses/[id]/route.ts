import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { expenseSchemaWithId } from "@/schemas/expense-schema";

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

// PATCH - Update Expense and adjust bank + sale + receipts
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = expenseSchemaWithId.safeParse({ id, ...body });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", issues: parsed.error.errors },
        { status: 400 }
      );
    }

    const { id: _omitId, ...data } = parsed.data; void _omitId;

    const oldExpense = await prisma.expense.findUnique({ where: { id } });
    if (!oldExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const oldDate = new Date(oldExpense.date);
    const newDate = new Date(data.date);
    const amountDiff = data.amount - oldExpense.amount; // positive = increase, negative = decrease

    const [updatedExpense] = await prisma.$transaction(async (tx) => {
      // 1. Update expense
      const updated = await tx.expense.update({
        where: { id },
        data,
      });

      // 2. Adjust Bank balance
      if (oldExpense.bankId && amountDiff !== 0) {
        if (amountDiff > 0) {
          await tx.bank.update({
            where: { id: oldExpense.bankId },
            data: { balanceAmount: { decrement: amountDiff } },
          });
        } else {
          await tx.bank.update({
            where: { id: oldExpense.bankId },
            data: { balanceAmount: { increment: Math.abs(amountDiff) } },
          });
        }
      }

      // 3. Adjust BalanceReceipt
      if (oldDate.toDateString() === newDate.toDateString()) {
        // same date → just apply diff
        const receipt = await tx.balanceReceipt.findFirst({
          where: {
            branchId: oldExpense.branchId,
            date: {
              gte: new Date(oldDate.setHours(0, 0, 0, 0)),
              lte: new Date(oldDate.setHours(23, 59, 59, 999)),
            },
          },
        });

        if (receipt && amountDiff !== 0) {
          await tx.balanceReceipt.update({
            where: { id: receipt.id },
            data: {
              amount:
                amountDiff > 0
                  ? { decrement: amountDiff }
                  : { increment: Math.abs(amountDiff) },
            },
          });
        }
      } else {
        // date changed → reverse from old receipt, apply to new receipt
        const oldReceipt = await tx.balanceReceipt.findFirst({
          where: {
            branchId: oldExpense.branchId,
            date: {
              gte: new Date(oldDate.setHours(0, 0, 0, 0)),
              lte: new Date(oldDate.setHours(23, 59, 59, 999)),
            },
          },
        });

        const newReceipt = await tx.balanceReceipt.findFirst({
          where: {
            branchId: oldExpense.branchId,
            date: {
              gte: new Date(newDate.setHours(0, 0, 0, 0)),
              lte: new Date(newDate.setHours(23, 59, 59, 999)),
            },
          },
        });

        // 3a. Restore old receipt with full old amount
        if (oldReceipt) {
          await tx.balanceReceipt.update({
            where: { id: oldReceipt.id },
            data: { amount: { increment: oldExpense.amount } },
          });
        }

        // 3b. Deduct new amount from new receipt
        if (newReceipt) {
          await tx.balanceReceipt.update({
            where: { id: newReceipt.id },
            data: { amount: { decrement: data.amount } },
          });
        }
      }

      // 4. Adjust Sale if required (same-date only, optional)
      const sale = await tx.sale.findFirst({
        where: {
          date: newDate,
          branchId: oldExpense.branchId,
        },
      });

      if (sale && amountDiff !== 0 && oldDate.toDateString() === newDate.toDateString()) {
        await tx.sale.update({
          where: { id: sale.id },
          data: {
            rate:
              amountDiff > 0
                ? { decrement: amountDiff }
                : { increment: Math.abs(amountDiff) },
          },
        });
      }

      return [updated];
    });

    return NextResponse.json({ data: updatedExpense }, { status: 200 });
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Remove expense and refund to bank + sale
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

    const expenseDate = new Date(oldExpense.date);

    const [deletedExpense] = await prisma.$transaction(async (tx) => {
      // 1. Delete expense
      const removed = await tx.expense.delete({ where: { id } });

      // 2. Refund Bank
      if (oldExpense.bankId) {
        await tx.bank.update({
          where: { id: oldExpense.bankId },
          data: { balanceAmount: { increment: oldExpense.amount } },
        });
      }

      // 3. Increment back in BalanceReceipt
      const existingReceipt = await tx.balanceReceipt.findFirst({
        where: {
          branchId: oldExpense.branchId,
          date: {
            gte: new Date(expenseDate.setHours(0, 0, 0, 0)),
            lte: new Date(expenseDate.setHours(23, 59, 59, 999)),
          },
        },
      });

      if (existingReceipt) {
        await tx.balanceReceipt.update({
          where: { id: existingReceipt.id },
          data: { amount: { increment: oldExpense.amount } }, // undo earlier decrement
        });
      }

      // 4. Refund Sale
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

      return [removed];
    });

    return NextResponse.json({ data: deletedExpense }, { status: 200 });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}