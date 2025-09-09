import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { purchaseOrderSchema } from "@/schemas/purchase-order";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Zod validation
    const result = purchaseOrderSchema.safeParse(body);
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
    

    // Create the purchase order
    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        ...result.data,
        branchId
      },
    });

    return NextResponse.json({ data: purchaseOrder }, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
