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

// PATCH - Update Expense and adjust bank + sale
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

    const oldExpense = await prisma.expense.findUnique({
      where: { id },
    });

    if (!oldExpense) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const amountDiff = data.amount - oldExpense.amount;
    const expenseDate = new Date(oldExpense.date);

    const [updatedExpense] = await prisma.$transaction(async (tx) => {
      // 1. Update expense
      const updated = await tx.expense.update({
        where: { id },
        data,
      });

      // 2. Adjust Bank
      if (oldExpense.bankId) {
        await tx.bank.update({
          where: { id: oldExpense.bankId },
          data: { balanceAmount: { decrement: amountDiff } }, // mirror bank deposit logic
        });
      }

      // 3. Adjust BalanceReceipt
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
          data: { amount: { decrement: amountDiff } }, // expense → reduce cash
        });
      }

      // 4. Adjust Sale (if required)
      const sale = await tx.sale.findFirst({
        where: {
          date: new Date(oldExpense.date),
          branchId: oldExpense.branchId,
        },
      });

      if (sale && amountDiff !== 0) {
        await tx.sale.update({
          where: { id: sale.id },
          data: { rate: { decrement: amountDiff } },
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