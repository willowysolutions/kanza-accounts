import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { supplierPaymentSchema } from "@/schemas/supplier-payment-schema";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate request body
    const result = supplierPaymentSchema.safeParse(body);
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


    const { supplierId, amount, paymentMethod,paidOn } = result.data;

    // Run everything in one transaction
    const [payment, paymentHistory] = await prisma.$transaction([
      prisma.supplierPayment.create({
      data: {
        ...result.data,
        branchId
      },
      }),

      prisma.supplier.update({
        where: { id: supplierId },
        data: {
          outstandingPayments: {
            decrement: amount,
          },
        },
      }),

      prisma.paymentHistory.create({
        data: {
          supplierId,
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
