import { NextRequest, NextResponse } from "next/server";
import { supplierSchema } from "@/schemas/supplier-schema";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Zod validation
    const result = supplierSchema.safeParse(body);
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

    const supplier = await prisma.supplier.create({
      data: {
        ...result.data,
        outstandingPayments,
        branchId,
      }
    });
      revalidatePath("/suppliers");
    return NextResponse.json({ data: supplier }, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}




