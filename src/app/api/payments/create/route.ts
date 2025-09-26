import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { customerPaymentSchema } from "@/schemas/payment-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { updateBalanceReceiptForPaymentIST } from "@/lib/ist-balance-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const result = customerPaymentSchema.safeParse(body);
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


    const { customerId, amount, paymentMethod,paidOn } = result.data;

    // Run everything in one transaction
    const [payment, paymentHistory] = await prisma.$transaction(async (tx) => {
      // 1. Create customer payment
      const createdPayment = await tx.customerPayment.create({
        data: {
          ...result.data,
          branchId
        },
      });

      // 2. Update customer outstanding (decrement)
      await tx.customer.update({
        where: { id: customerId },
        data: {
          outstandingPayments: {
            decrement: amount,
          },
        },
      });

      // 3. Create payment history
      const createdPaymentHistory = await tx.paymentHistory.create({
        data: {
          customerId,
          branchId,
          paymentMethod: paymentMethod,
          paidAmount: amount,
          paidOn: paidOn,
        },
      });

      // 4. Update BalanceReceipt for payment (positive amount = cash received from customer)
      if (branchId) {
        await updateBalanceReceiptForPaymentIST(branchId, new Date(paidOn), amount, tx);
      }

      return [createdPayment, createdPaymentHistory];
    });

    revalidatePath("/payments");

    return NextResponse.json({ data: payment, history: paymentHistory }, { status: 201 });
  } catch (error) {
    console.error("Error creating payments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
