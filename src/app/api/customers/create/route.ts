import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { customerSchema } from "@/schemas/customers-schema";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Zod validation
    const result = customerSchema.safeParse(body);
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

    const outstandingPayments = result.data.openingBalance

    const customer = await prisma.customer.create({
      data: {
        ...result.data,
        branchId,
        outstandingPayments
      },
    });
      revalidatePath("/customers");
    return NextResponse.json({ data: customer }, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




