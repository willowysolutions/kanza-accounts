import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { creditSchema } from "@/schemas/credit-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // ✅ Validate with Zod
    const result = creditSchema.safeParse(body);
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
    const { customerId, amount, date, ...rest } = result.data;

    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const [newCredit] = await prisma.$transaction(async (tx) => {
      // 1. Create credit
      const createdCredit = await tx.credit.create({
        data: {
          customerId,
          amount,
          branchId,
          date,
          ...rest,
        },
      });

      // 2. Update customer outstanding
      await tx.customer.update({
        where: { id: customerId },
        data: {
          outstandingPayments: { increment: amount },
        },
      });

      // 3. Update BalanceReceipt
      const creditDate = new Date(date);

      const existingReceipt = await tx.balanceReceipt.findFirst({
        where: {
          branchId,
          date: {
            gte: new Date(creditDate.setHours(0, 0, 0, 0)),
            lte: new Date(creditDate.setHours(23, 59, 59, 999)),
          },
        },
      });

      if (existingReceipt) {
        await tx.balanceReceipt.update({
          where: { id: existingReceipt.id },
          data: {
            amount: { decrement: amount },
          },
        });
      } else {
        await tx.balanceReceipt.create({
          data: {
            date: new Date(date),
            amount: -amount,
            branchId,
          },
        });
      }

      return [createdCredit];
    });

    revalidatePath("/credits");
    return NextResponse.json({ data: newCredit }, { status: 201 });

  } catch (error) {
    console.error("Error creating credit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
