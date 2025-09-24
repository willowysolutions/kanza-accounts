import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { bankDepositeSchema } from "@/schemas/bank-deposite-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { updateBalanceReceiptIST } from "@/lib/ist-balance-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ✅ Validate with Zod
    const result = bankDepositeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          issues: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const branchId = session?.user?.branch;
    const { bankId, amount, date } = result.data;

    const bankDeposite = await prisma.$transaction(async (tx) => {
      // 1. Create BankDeposit
      const newDeposit = await tx.bankDeposite.create({
        data: {
          ...result.data,
          branchId
        },
      });

      // 2. Increment Bank Balance
      await tx.bank.update({
        where: { id: bankId },
        data: {
          balanceAmount: {
            increment: amount,
          },
        },
      });

      // 3. Update BalanceReceipt (negative amount = cash moved to bank)
      if (branchId) {
        await updateBalanceReceiptIST(branchId, date, -amount, tx);
      }

      return newDeposit;
    });

    revalidatePath("/bank-deposite");
    return NextResponse.json({ data: bankDeposite }, { status: 201 });
  } catch (error) {
    console.error("Error creating bank deposit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
