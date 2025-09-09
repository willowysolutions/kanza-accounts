import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { customerPaymentSchema } from "@/schemas/payment-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
    const [payment, paymentHistory] = await prisma.$transaction([
      prisma.customerPayment.create({
      data: {
        ...result.data,
        branchId
      },
      }),

      prisma.customer.update({
        where: { id: customerId },
        data: {
          outstandingPayments: {
            decrement: amount,
          },
        },
      }),

      prisma.paymentHistory.create({
        data: {
          customerId,
          branchId,
          paymentMethod:paymentMethod,
          paidAmount:amount,
          paidOn: paidOn,
        },
      }),
    ]);

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
