import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { expenseSchema } from "@/schemas/expense-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { updateBalanceReceipt } from "@/lib/balance-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ✅ Validate input
    const result = expenseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    const branchId = session?.user?.branch;
    const { bankId, amount, date } = result.data;

    const expense = await prisma.$transaction(async (tx) => {
      // 1. Create expense
      const newExpense = await tx.expense.create({
        data: {
          ...result.data,
          branchId,
        },
      });

      // 2. Decrement from bank (if bankId present)
      if (bankId) {
        await tx.bank.update({
          where: { id: bankId },
          data: {
            balanceAmount: {
              decrement: amount,
            },
          },
        });
      }

      // 3. Update BalanceReceipt (negative amount = cash spent)
      if (branchId) {
        await updateBalanceReceipt(branchId, new Date(date), -amount, tx);
      }

      return newExpense;
    });

    revalidatePath("/expenses");
    return NextResponse.json({ data: expense }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
