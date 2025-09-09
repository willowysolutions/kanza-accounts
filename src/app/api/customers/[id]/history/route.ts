// app/api/customer/[customerId]/history/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: customerId } = await params;

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      );
    }


    // ✅ Get all credits for this customer
    const credits = await prisma.credit.findMany({
      where: { customerId },
      select: {
        id: true,
        customer: true,
        fuelType: true,
        quantity: true,
        amount: true,
        date: true,
        createdAt: true,
      },
      orderBy: { date: "desc" },
    });

    // ✅ Get all payments for this customer
    const payments = await prisma.customerPayment.findMany({
      where: { customerId },
      select: {
        id: true,
        amount: true,
        paymentMethod: true,
        paidOn: true,
        createdAt: true,
      },
      orderBy: { paidOn: "desc" },
    });

    // ✅ Normalize into one flat timeline
    const history = [
      ...credits.map((c) => ({
        id: c.id,
        customer: c.customer?.name,
        type: "credit" as const,
        fuelType: c.fuelType,
        quantity: c.quantity,
        amount: c.amount,
        date: c.date,
        createdAt: c.createdAt,
      })),
      ...payments.map((p) => ({
        id: p.id,
        type: "payment" as const,
        amount: p.amount,
        method: p.paymentMethod,
        date: p.paidOn,
        createdAt: p.createdAt,
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return NextResponse.json({
      customerId,
      history, // ✅ flat array instead of grouped
    });
  } catch (err) {
    console.error("Customer history fetch error:", err);
    return NextResponse.json(
      { error: "Failed to fetch customer history" },
      { status: 500 }
    );
  }
}
